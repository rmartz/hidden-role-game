import { randomUUID } from "crypto";
import { GameStatus } from "@/lib/models";
import type { Game, LobbyPlayer, PlayerRoleAssignment } from "@/lib/models";
import type { RoleSlot } from "@/server/models";

export class GameService {
  private games: Record<string, Game> = {};

  public createGame(
    lobbyId: string,
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): Game {
    const roleIds: string[] = [];
    for (const slot of roleSlots) {
      for (let i = 0; i < slot.count; i++) {
        roleIds.push(slot.roleId);
      }
    }

    for (let i = roleIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = roleIds[i]!;
      roleIds[i] = roleIds[j]!;
      roleIds[j] = tmp;
    }

    const roleAssignments: PlayerRoleAssignment[] = players.map((p, i) => ({
      playerId: p.id,
      roleDefinitionId: roleIds[i]!,
    }));

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
