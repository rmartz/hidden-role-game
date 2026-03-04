import type { Lobby } from "../../lib/models";

export class LobbyService {
  private lobbies: Record<string, Lobby> = {};

  public addLobby(lobby: Lobby) {
    this.lobbies[lobby.id] = lobby;
  }

  public getLobby(lobbyId: string): Lobby | undefined {
    return this.lobbies[lobbyId];
  }

  public isValidSession(lobbyId: string, sessionId: string): boolean {
    const lobby = this.getLobby(lobbyId);
    if (!lobby) return false;
    return lobby.players.some((p) => p.sessionId === sessionId);
  }
}
