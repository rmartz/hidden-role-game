import { GameStatus } from "@/lib/models";
import type { Lobby, PlayerRoleAssignment } from "@/lib/models";
import type { RoleSlot } from "@/server/models";

export class LobbyService {
  private lobbies: Record<string, Lobby> = {};

  public addLobby(lobby: Lobby) {
    this.lobbies[lobby.id] = lobby;
  }

  public getLobby(lobbyId: string): Lobby | undefined {
    return this.lobbies[lobbyId];
  }

  public transferOwner(
    lobbyId: string,
    targetPlayerId: string,
  ): Lobby | undefined {
    const lobby = this.lobbies[lobbyId];
    if (!lobby) return undefined;

    const target = lobby.players.find((p) => p.id === targetPlayerId);
    if (!target) return undefined;

    lobby.ownerSessionId = target.sessionId;
    return lobby;
  }

  public startGame(lobbyId: string, roleSlots: RoleSlot[]): Lobby | undefined {
    const lobby = this.lobbies[lobbyId];
    if (!lobby) return undefined;

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

    const roleAssignments: PlayerRoleAssignment[] = lobby.players.map(
      (p, i) => ({ playerId: p.id, roleDefinitionId: roleIds[i]! }),
    );

    lobby.game = {
      status: { type: GameStatus.Playing },
      players: [...lobby.players],
      roleAssignments,
    };

    return lobby;
  }

  public removePlayer(lobbyId: string, playerId: string): Lobby | undefined {
    const lobby = this.lobbies[lobbyId];
    if (!lobby) return undefined;

    lobby.players = lobby.players.filter((p) => p.id !== playerId);

    return lobby;
  }
}

declare global {
  var lobbyServiceInstance: LobbyService | undefined;
}

export const lobbyService: LobbyService =
  globalThis.lobbyServiceInstance ??
  (globalThis.lobbyServiceInstance = new LobbyService());
