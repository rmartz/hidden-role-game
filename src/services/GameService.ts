import { randomUUID } from "crypto";
import { GameStatus } from "@/lib/types";
import type {
  Game,
  GameModeConfig,
  LobbyPlayer,
  RoleSlot,
  GameMode,
  ShowRolesInPlay,
} from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import {
  firebaseGameService,
  FirebaseGameService,
} from "./FirebaseGameService";
import { gameStateService, GameStateService } from "./GameStateService";

/**
 * Game orchestrator — combines GameStateService (business logic) with
 * FirebaseGameService (data access) to fulfill game operations.
 * API routes call this layer, not the Firebase or state services directly.
 */
export class GameService {
  constructor(
    private readonly firebase: FirebaseGameService,
    private readonly state: GameStateService,
  ) {}

  public getModeDefinition(gameMode: GameMode): GameModeConfig {
    return this.state.getModeDefinition(gameMode);
  }

  /** Create a game from lobby data, persist to Firebase, compute player states. */
  public async createGame(
    lobbyId: string,
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
    gameMode: GameMode,
    showRolesInPlay: ShowRolesInPlay,
    ownerPlayerId: string | undefined,
    timerConfig: import("@/lib/types").TimerConfig,
    modeConfig?: import("@/lib/types").ModeConfig,
  ): Promise<Game> {
    const game = this.state.buildGame(
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

    await this.firebase.saveGame(game);
    await this.writePlayerStates(game);

    return game;
  }

  /** Read a game from Firebase. */
  public async getGame(gameId: string): Promise<Game | undefined> {
    return this.firebase.getGame(gameId);
  }

  /** Read a player's pre-computed game state from Firebase. */
  public async getPlayerGameStateBySession(
    gameId: string,
    sessionId: string,
  ): Promise<PlayerGameState | null> {
    return this.firebase.getPlayerGameStateBySession(gameId, sessionId);
  }

  /** Advance a game from Starting to Playing. */
  public async advanceToPlaying(gameId: string): Promise<Game | null> {
    const game = await this.firebase.getGame(gameId);
    if (game?.status.type !== GameStatus.Starting) return null;

    game.status = this.state.buildPlayingStatus(game);

    await this.firebase.updateGameStatus(gameId, game.status);
    await this.writePlayerStates(game);

    return game;
  }

  /** Apply a game action via Firebase transaction, then recompute player states. */
  public async applyAction(
    gameId: string,
    actionId: string,
    callerId: string,
    payload: unknown,
  ): Promise<{ game: Game } | { error: string }> {
    const baseGame = await this.firebase.getGame(gameId);
    if (!baseGame) return { error: "Game not found" };

    const config = this.state.getModeDefinition(baseGame.gameMode);
    const action = config.actions[actionId];
    if (!action) return { error: "Unknown action" };

    const result = await this.firebase.applyStatusTransaction(
      gameId,
      baseGame,
      (game) => {
        if (!action.isValid(game, callerId, payload)) return undefined;
        action.apply(game, payload, callerId);
        return game;
      },
    );

    if ("error" in result) return result;

    await this.writePlayerStates(result.game);
    return result;
  }

  /** Adjust role slots when a player joins or leaves. */
  public adjustRoleSlotsForPlayer(
    current: RoleSlot[],
    gameMode: GameMode,
    numPlayers: number,
    operation: "add" | "remove",
  ): RoleSlot[] {
    return this.state.adjustRoleSlotsForPlayer(
      current,
      gameMode,
      numPlayers,
      operation,
    );
  }

  /** Compute and write all player states to Firebase. */
  private async writePlayerStates(game: Game): Promise<void> {
    const states = this.state.buildAllPlayerStates(game);
    await this.firebase.writeAllPlayerStates(game.id, states);
  }
}

declare global {
  var gameServiceInstance: GameService | undefined;
}

export const gameService: GameService =
  globalThis.gameServiceInstance ??
  (globalThis.gameServiceInstance = new GameService(
    firebaseGameService,
    gameStateService,
  ));
