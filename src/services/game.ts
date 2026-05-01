import type {
  Game,
  GamePlayer,
  GameStatusState,
  VisibilityReason,
} from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import { getAdminDatabase } from "@/lib/firebase/admin";
import { ServerValue } from "firebase-admin/database";
import {
  gameToFirebase,
  firebaseToGame,
  playerStateToFirebase,
  firebaseToPlayerState,
  type FirebaseGamePublic,
  type FirebasePlayerState,
} from "@/lib/firebase/schema";

function gameRef(gameId: string) {
  return getAdminDatabase().ref(`games/${gameId}`);
}

/** Write a new game to Firebase. */
export async function saveGame(game: Game): Promise<void> {
  const sessionIndex: Record<string, string> = {};
  for (const p of game.players) {
    if (p.sessionId) sessionIndex[p.sessionId] = p.id;
  }

  await gameRef(game.id).set({
    public: { ...gameToFirebase(game), createdAt: ServerValue.TIMESTAMP },
    sessionIndex,
  });
}

/** Read a game from Firebase. */
export async function getGame(gameId: string): Promise<Game | undefined> {
  const snap = await gameRef(gameId).once("value");
  if (!snap.exists()) return undefined;

  const data = snap.val() as {
    public?: FirebaseGamePublic;
    sessionIndex?: Record<string, string>;
  };
  if (!data.public) return undefined;

  const playerIdToSession = new Map(
    Object.entries(data.sessionIndex ?? {}).map(([sid, pid]) => [pid, sid]),
  );

  const players: GamePlayer[] = Object.values(data.public.players).map((p) => {
    const visiblePlayers = (p.visiblePlayers ?? []).map((vp) => ({
      playerId: vp.playerId,
      reason: vp.reason as VisibilityReason,
      ...(vp.roleId ? { roleId: vp.roleId } : {}),
    }));
    if (p.noDevice)
      return {
        id: p.id,
        name: p.name,
        noDevice: true as const,
        visiblePlayers,
      };
    return {
      id: p.id,
      name: p.name,
      sessionId: playerIdToSession.get(p.id) ?? "",
      visiblePlayers,
    };
  });

  return firebaseToGame(gameId, data.public, players);
}

/** Read a player's pre-computed game state from Firebase. */
export async function getPlayerGameStateBySession(
  gameId: string,
  sessionId: string,
): Promise<PlayerGameState | null> {
  const snap = await getAdminDatabase()
    .ref(`games/${gameId}/playerState/${sessionId}`)
    .once("value");
  if (!snap.exists()) return null;
  return firebaseToPlayerState(snap.val() as FirebasePlayerState);
}

/** Write pre-computed PlayerGameState for every player to Firebase. */
export async function writeAllPlayerStates(
  gameId: string,
  states: Map<string, PlayerGameState>,
): Promise<void> {
  const updates: Record<string, unknown> = {};
  for (const [sessionId, state] of states) {
    updates[`games/${gameId}/playerState/${sessionId}`] =
      playerStateToFirebase(state);
  }
  if (Object.keys(updates).length > 0) {
    await getAdminDatabase().ref().update(updates);
  }
}

/** Write game status to Firebase. */
export async function updateGameStatus(
  gameId: string,
  status: GameStatusState,
): Promise<void> {
  await gameRef(gameId).child("public/status").set(JSON.stringify(status));
}

/**
 * Apply a mutation to the game status via Firebase transaction.
 * The `mutate` callback receives the current game state and should
 * return the mutated game if valid, or `undefined` to abort.
 * Firebase retries if the underlying value changed concurrently.
 */
export async function applyStatusTransaction(
  gameId: string,
  baseGame: Game,
  mutate: (game: Game) => Game | undefined,
): Promise<{ game: Game } | { error: string }> {
  let finalGame: Game | undefined;
  const result = await gameRef(gameId)
    .child("public/status")
    .transaction((currentStatusJson: string | null) => {
      const statusJson = currentStatusJson ?? JSON.stringify(baseGame.status);
      const currentStatus = JSON.parse(statusJson) as GameStatusState;
      const game: Game = { ...baseGame, status: currentStatus };
      const mutated = mutate(game);
      if (!mutated) return undefined;
      finalGame = mutated;
      return JSON.stringify(mutated.status);
    });

  if (!result.committed || !finalGame) {
    return { error: "Action not valid for current game state" };
  }

  const committedStatusJson = result.snapshot.val() as string | null;
  const committedGame =
    committedStatusJson !== null
      ? {
          ...baseGame,
          status: JSON.parse(committedStatusJson) as GameStatusState,
        }
      : finalGame;
  return { game: committedGame };
}
