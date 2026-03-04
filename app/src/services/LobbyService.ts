import type { Lobby } from "@/lib/models";

export class LobbyService {
  private lobbies: Record<string, Lobby> = {};

  public addLobby(lobby: Lobby) {
    this.lobbies[lobby.id] = lobby;
  }

  public getLobby(lobbyId: string): Lobby | undefined {
    return this.lobbies[lobbyId];
  }

  public removePlayer(lobbyId: string, playerId: string): Lobby | null {
    const lobby = this.lobbies[lobbyId];
    if (!lobby) return null;

    lobby.players = lobby.players.filter((p) => p.id !== playerId);

    if (lobby.players.length === 0) {
      delete this.lobbies[lobbyId];
      return null;
    }

    if (!lobby.players.some((p) => p.sessionId === lobby.ownerSessionId)) {
      lobby.ownerSessionId = lobby.players[0].sessionId;
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
