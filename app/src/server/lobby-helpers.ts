import type { Lobby } from "@/lib/models";
import type { PublicLobby } from "@/server/models";

export function isValidSession(lobby: Lobby, sessionId: string): boolean {
  return lobby.players.some((p) => p.sessionId === sessionId);
}

export function toPublicLobby(
  lobby: Lobby,
  callerSessionId?: string,
): PublicLobby {
  const owner = lobby.players.find((p) => p.sessionId === lobby.ownerSessionId);
  const isOwner = callerSessionId === lobby.ownerSessionId;
  const showRoleSlots = isOwner || lobby.showConfigToPlayers;
  return {
    id: lobby.id,
    ownerPlayerId: owner?.id ?? "",
    players: lobby.players.map((p) => ({ id: p.id, name: p.name })),
    config: {
      gameMode: lobby.gameMode,
      showConfigToPlayers: lobby.showConfigToPlayers,
      showRolesInPlay: lobby.showRolesInPlay,
      ...(showRoleSlots && { roleSlots: lobby.roleSlots }),
    },
    ...(lobby.gameId && { gameId: lobby.gameId }),
  };
}
