import { randomUUID } from "crypto";
import { GameStatus } from "@/lib/types";
import type {
  Game,
  Lobby,
  LobbyPlayer,
  ModeConfig,
  RoleBucket,
  GameMode,
  ShowRolesInPlay,
  TimerConfig,
} from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import {
  saveGame,
  getGame as firebaseGetGame,
  getPlayerGameStateBySession as firebaseGetPlayerGameStateBySession,
  writeAllPlayerStates,
  updateGameStatus,
  applyStatusTransaction,
} from "@/services/game";
import {
  getModeDefinition,
  buildGame,
  buildPlayingStatus,
  buildAllPlayerStates,
} from "@/lib/game/state";

export { getModeDefinition };

/** Compute and write all player states to Firebase. */
async function writePlayerStates(game: Game): Promise<void> {
  const states = buildAllPlayerStates(game);
  try {
    await writeAllPlayerStates(game.id, states);
  } catch (err) {
    console.error(
      `[writePlayerStates] writeAllPlayerStates failed for game ${game.id}:`,
      err,
    );
    throw err;
  }
}

/** Create a game from lobby data, persist to Firebase, compute player states. */
export async function createGame(
  lobbyId: string,
  players: LobbyPlayer[],
  roleBuckets: RoleBucket[],
  gameMode: GameMode,
  showRolesInPlay: ShowRolesInPlay,
  ownerPlayerId: string | undefined,
  timerConfig: TimerConfig,
  modeConfig?: ModeConfig,
  playerOrder?: string[],
): Promise<Game> {
  const game = buildGame(
    randomUUID(),
    lobbyId,
    players,
    roleBuckets,
    gameMode,
    showRolesInPlay,
    ownerPlayerId,
    timerConfig,
    modeConfig,
    playerOrder,
  );

  const saveTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => {
      reject(new Error(`[createGame] saveGame timed out for game ${game.id}`));
    }, 8000),
  );
  try {
    await Promise.race([saveGame(game), saveTimeout]);
  } catch (err) {
    console.error(`[createGame] saveGame failed for game ${game.id}:`, err);
    throw err;
  }
  await writePlayerStates(game);

  return game;
}

/** Read a game from Firebase. */
export async function getGame(gameId: string): Promise<Game | undefined> {
  return firebaseGetGame(gameId);
}

/** Read a player's pre-computed game state from Firebase. */
export async function getPlayerGameStateBySession(
  gameId: string,
  sessionId: string,
): Promise<PlayerGameState | null> {
  return firebaseGetPlayerGameStateBySession(gameId, sessionId);
}

/** Advance a game from Starting to Playing. */
export async function advanceToPlaying(gameId: string): Promise<Game | null> {
  const game = await firebaseGetGame(gameId);
  if (game?.status.type !== GameStatus.Starting) return null;

  game.status = buildPlayingStatus(game);

  await updateGameStatus(gameId, game.status);
  await writePlayerStates(game);

  return game;
}

/** Apply a game action via Firebase transaction, then recompute player states. */
export async function applyAction(
  gameId: string,
  actionId: string,
  callerId: string,
  payload: unknown,
): Promise<{ game: Game } | { error: string }> {
  const baseGame = await firebaseGetGame(gameId);
  if (!baseGame) return { error: "Game not found" };

  const config = getModeDefinition(baseGame.gameMode);
  const action = config.actions[actionId];
  if (!action) return { error: "Unknown action" };

  const result = await applyStatusTransaction(gameId, baseGame, (game) => {
    if (!action.isValid(game, callerId, payload)) return undefined;
    action.apply(game, payload, callerId);
    return game;
  });

  if ("error" in result) return result;

  await writePlayerStates(result.game);
  return result;
}

/**
 * Validates prerequisites before starting a game from a lobby. Checks that the
 * lobby's configured game mode matches the requested mode, then resolves the
 * owner player ID if the mode requires one.
 *
 * Returns `{ error }` on failure, or `{ ownerPlayerId }` on success.
 */
export function validateGameStartPrerequisites(
  lobby: Lobby,
  gameMode: GameMode,
): { error: string } | { ownerPlayerId: string | undefined } {
  if (lobby.config.gameMode !== gameMode) {
    return { error: "Game mode does not match lobby configuration" };
  }
  const definition = getModeDefinition(gameMode);
  const modeConfig = lobby.config.modeConfig;
  const ownerTitle =
    definition.resolveOwnerTitle?.(modeConfig) ?? definition.ownerTitle;
  const ownerPlayerId = ownerTitle
    ? lobby.players.find((p) => p.sessionId === lobby.ownerSessionId)?.id
    : undefined;
  return { ownerPlayerId };
}
