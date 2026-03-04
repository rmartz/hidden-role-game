import type { Lobby } from "@/lib/models";

export class LobbyService {
  private lobbies: Record<string, Lobby> = {};

  public addLobby(lobby: Lobby) {
    this.lobbies[lobby.id] = lobby;
  }

  public getLobby(lobbyId: string): Lobby | undefined {
    return this.lobbies[lobbyId];
  }
}

declare global {
  var lobbyServiceInstance: LobbyService | undefined;
}

export const lobbyService: LobbyService =
  globalThis.lobbyServiceInstance ??
  (globalThis.lobbyServiceInstance = new LobbyService());
