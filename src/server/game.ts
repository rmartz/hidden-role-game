import { randomUUID } from "crypto";
import { GameStatus } from "@/lib/types";
import type {
  Game,
  LobbyPlayer,
  ModeConfig,
  RoleSlot,
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
  await writeAllPlayerStates(game.id, states);
}

/** Create a game from lobby data, persist to Firebase, compute player states. */
export async function createGame(
  lobbyId: string,
  players: LobbyPlayer[],
  roleSlots: RoleSlot[],
  gameMode: GameMode,
  showRolesInPlay: ShowRolesInPlay,
  ownerPlayerId: string | undefined,
  timerConfig: TimerConfig,
  modeConfig?: ModeConfig,
): Promise<Game> {
  const game = buildGame(
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

  await saveGame(game);
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
