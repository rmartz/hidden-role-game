import { randomUUID } from "crypto";
import { GameStatus, GameMode } from "@/lib/models";
import type { Game, LobbyPlayer, RoleDefinition } from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import {
  secretVillainService,
  SecretVillainService,
} from "./SecretVillainService";

type GameModeService = Pick<
  SecretVillainService,
  "getRoleDefinitions" | "createRoleAssignments"
>;

export class GameService {
  private games: Record<string, Game> = {};

  private readonly modeServices: Record<GameMode, GameModeService> = {
    [GameMode.SecretVillain]: secretVillainService,
  };

  public createGame(
    lobbyId: string,
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
    gameMode: GameMode,
  ): Game {
    const service = this.modeServices[gameMode];
    const roleAssignments = service.createRoleAssignments(players, roleSlots);

    const game: Game = {
      id: randomUUID(),
      lobbyId,
      gameMode,
      status: { type: GameStatus.Playing },
      players: [...players],
      roleAssignments,
    };

    this.games[game.id] = game;
    return game;
  }

  public getGame(gameId: string): Game | undefined {
    return this.games[gameId];
  }

  public getRoleDefinitions(gameMode: GameMode): RoleDefinition[] {
    return this.modeServices[gameMode].getRoleDefinitions();
  }
}

declare global {
  var gameServiceInstance: GameService | undefined;
}

export const gameService: GameService =
  globalThis.gameServiceInstance ??
  (globalThis.gameServiceInstance = new GameService());
