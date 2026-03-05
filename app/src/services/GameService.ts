import { randomUUID } from "crypto";
import { GameStatus } from "@/lib/models";
import type { Game, LobbyPlayer } from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { assignRoles } from "./assignRoles";

export class GameService {
  private games: Record<string, Game> = {};

  public createGame(
    lobbyId: string,
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): Game {
    const roleAssignments = assignRoles(players, roleSlots);

    const game: Game = {
      id: randomUUID(),
      lobbyId,
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
}

declare global {
  var gameServiceInstance: GameService | undefined;
}

export const gameService: GameService =
  globalThis.gameServiceInstance ??
  (globalThis.gameServiceInstance = new GameService());
