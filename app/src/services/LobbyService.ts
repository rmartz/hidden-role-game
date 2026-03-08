import type { GameMode, Lobby, RoleSlot } from "@/lib/models";
import { getDefaultRoleSlots } from "@/lib/game-modes";

export class LobbyService {
  private lobbies: Record<string, Lobby> = {};

  public addLobby(lobby: Lobby) {
    this.lobbies[lobby.id] = lobby;
  }

  public getLobby(lobbyId: string): Lobby | undefined {
    return this.lobbies[lobbyId];
  }

  public setGameId(lobbyId: string, gameId: string): Lobby | undefined {
    const lobby = this.lobbies[lobbyId];
    if (!lobby) return undefined;
    lobby.gameId = gameId;
    return lobby;
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

  public removePlayer(lobbyId: string, playerId: string): Lobby | undefined {
    const lobby = this.lobbies[lobbyId];
    if (!lobby) return undefined;

    lobby.players = lobby.players.filter((p) => p.id !== playerId);

    return lobby;
  }

  public updateConfig(
    lobbyId: string,
    config: {
      showConfigToPlayers?: boolean;
      showRolesInPlay?: boolean;
      gameMode?: GameMode;
      roleSlots?: RoleSlot[];
    },
  ): Lobby | undefined {
    const lobby = this.lobbies[lobbyId];
    if (!lobby) return undefined;

    if (config.showConfigToPlayers !== undefined)
      lobby.config.showConfigToPlayers = config.showConfigToPlayers;
    if (config.showRolesInPlay !== undefined)
      lobby.config.showRolesInPlay = config.showRolesInPlay;
    if (
      config.gameMode !== undefined &&
      config.gameMode !== lobby.config.gameMode
    ) {
      lobby.config.gameMode = config.gameMode;
      lobby.config.roleSlots = getDefaultRoleSlots(
        config.gameMode,
        lobby.players.length,
      );
    } else if (config.roleSlots !== undefined) {
      lobby.config.roleSlots = config.roleSlots;
    }

    return lobby;
  }
}

declare global {
  var lobbyServiceInstance: LobbyService | undefined;
}

export const lobbyService: LobbyService =
  globalThis.lobbyServiceInstance ??
  (globalThis.lobbyServiceInstance = new LobbyService());
