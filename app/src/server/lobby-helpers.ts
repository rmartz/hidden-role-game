import type { Lobby } from "@/lib/models";
import type { PublicLobby } from "@/server/models";

export function isValidSession(lobby: Lobby, sessionId: string): boolean {
  return lobby.players.some((p) => p.sessionId === sessionId);
}

export function toPublicLobby(lobby: Lobby): PublicLobby {
  const owner = lobby.players.find((p) => p.sessionId === lobby.ownerSessionId);
  return {
    id: lobby.id,
    ownerPlayerId: owner?.id ?? "",
    players: lobby.players.map((p) => ({ id: p.id, name: p.name })),
    ...(lobby.gameId && { gameId: lobby.gameId }),
  };
}
