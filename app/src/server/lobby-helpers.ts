import type { Lobby, LobbyPlayer } from "@/lib/models";
import type { PublicLobby, PublicLobbyPlayer } from "@/server/models";

export function isValidSession(lobby: Lobby, sessionId: string): boolean {
  return lobby.players.some((p) => p.sessionId === sessionId);
}

export function toPublicLobby(lobby: Lobby): PublicLobby {
  const mapPlayers = (ps: LobbyPlayer[]): PublicLobbyPlayer[] =>
    ps.map((p) => ({ id: p.id, name: p.name }));
  return {
    id: lobby.id,
    players: mapPlayers(lobby.players),
    ...(lobby.game && {
      game: {
        status: lobby.game.status,
        players: mapPlayers(lobby.game.players),
      },
    }),
  };
}
