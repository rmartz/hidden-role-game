import { randomUUID } from "crypto";
import { GameStatus, GameMode, ShowRolesInPlay } from "@/lib/types";
import type {
  Game,
  GamePlayer,
  LobbyPlayer,
  RoleSlot,
  VisibilityReason,
} from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";
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
import { gameStateService } from "./GameStateService";

function gameRef(gameId: string) {
  return getAdminDatabase().ref(`games/${gameId}`);
}

/**
 * Firebase data access layer for games. Handles reading and writing
 * game data to Firebase RTDB. Delegates all business logic to
 * GameStateService and GameModeServices.
 */
export class FirebaseGameService {
  /** Write pre-computed PlayerGameState for every player to Firebase. */
  private async writeAllPlayerStates(game: Game): Promise<void> {
    const states = gameStateService.buildAllPlayerStates(game);
    const updates: Record<string, unknown> = {};
    for (const [sessionId, state] of states) {
      updates[`games/${game.id}/playerState/${sessionId}`] =
        playerStateToFirebase(state as WerewolfPlayerGameState);
    }
    if (Object.keys(updates).length > 0) {
      await getAdminDatabase().ref().update(updates);
    }
  }

  /** Create a game in Firebase from lobby data. */
  public async createGame(
    lobbyId: string,
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
    gameMode: GameMode,
    showRolesInPlay: ShowRolesInPlay,
    ownerPlayerId: string | undefined,
    timerConfig: import("@/lib/types").TimerConfig,
    modeConfig?: Record<string, unknown>,
  ): Promise<Game> {
    const game = gameStateService.buildGame(
      randomUUID(),
      lobbyId,
      players,
      roleSlots,
      gameMode,
      showRolesInPlay,
      ownerPlayerId,
      timerConfig,
      modeConfig,
    );

    const sessionIndex: Record<string, string> = {};
    for (const p of game.players) {
      sessionIndex[p.sessionId] = p.id;
    }

    await gameRef(game.id).set({
      public: { ...gameToFirebase(game), createdAt: ServerValue.TIMESTAMP },
      sessionIndex,
    });
    await this.writeAllPlayerStates(game);

    return game;
  }

  /** Read a game from Firebase. */
  public async getGame(gameId: string): Promise<Game | undefined> {
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

    const players: GamePlayer[] = Object.values(data.public.players).map(
      (p) => ({
        id: p.id,
        name: p.name,
        sessionId: playerIdToSession.get(p.id) ?? "",
        visiblePlayers: (p.visiblePlayers ?? []).map((vp) => ({
          playerId: vp.playerId,
          reason: vp.reason as VisibilityReason,
        })),
      }),
    );

    return firebaseToGame(gameId, data.public, players);
  }

  /** Read a player's pre-computed game state from Firebase. */
  public async getPlayerGameStateBySession(
    gameId: string,
    sessionId: string,
  ): Promise<PlayerGameState | null> {
    const snap = await getAdminDatabase()
      .ref(`games/${gameId}/playerState/${sessionId}`)
      .once("value");
    if (!snap.exists()) return null;
    return firebaseToPlayerState(snap.val() as FirebasePlayerState);
  }

  /** Advance a game from Starting to Playing in Firebase. */
  public async advanceToPlaying(gameId: string): Promise<Game | null> {
    const game = await this.getGame(gameId);
    if (game?.status.type !== GameStatus.Starting) return null;

    game.status = gameStateService.buildPlayingStatus(game);

    await gameRef(gameId)
      .child("public/status")
      .set(JSON.stringify(game.status));
    await this.writeAllPlayerStates(game);

    return game;
  }

  /** Apply a game action via Firebase transaction. */
  public async applyAction(
    gameId: string,
    actionId: string,
    callerId: string,
    payload: unknown,
  ): Promise<{ game: Game } | { error: string }> {
    const baseGame = await this.getGame(gameId);
    if (!baseGame) return { error: "Game not found" };

    const config = gameStateService.getModeDefinition(baseGame.gameMode);
    const action = config.actions[actionId];
    if (!action) return { error: "Unknown action" };

    let finalGame: Game | undefined;
    const result = await gameRef(gameId)
      .child("public/status")
      .transaction((currentStatusJson: string | null) => {
        const statusJson = currentStatusJson ?? JSON.stringify(baseGame.status);
        const currentStatus = JSON.parse(
          statusJson,
        ) as import("@/lib/types").GameStatusState;
        const game: Game = { ...baseGame, status: currentStatus };
        if (!action.isValid(game, callerId, payload)) return undefined;
        action.apply(game, payload, callerId);
        finalGame = game;
        return JSON.stringify(game.status);
      });

    if (!result.committed || !finalGame) {
      return { error: "Action not valid for current game state" };
    }

    const committedStatusJson = result.snapshot.val() as string | null;
    const committedGame =
      committedStatusJson !== null
        ? ({
            ...baseGame,
            status: JSON.parse(
              committedStatusJson,
            ) as import("@/lib/types").GameStatusState,
          } as Game)
        : finalGame;
    await this.writeAllPlayerStates(committedGame);
    return { game: committedGame };
  }
}

declare global {
  var firebaseGameServiceInstance: FirebaseGameService | undefined;
}

export const gameService: FirebaseGameService =
  globalThis.firebaseGameServiceInstance ??
  (globalThis.firebaseGameServiceInstance = new FirebaseGameService());
