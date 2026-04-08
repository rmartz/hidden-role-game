import type { Lobby } from "@/lib/types";
import type { GameConfig, PublicLobby } from "@/server/types";

export function isValidSession(lobby: Lobby, sessionId: string): boolean {
  return lobby.players.some((p) => p.sessionId === sessionId);
}

export function toPublicLobby(
  lobby: Lobby,
  callerSessionId?: string,
): PublicLobby {
  const owner = lobby.players.find((p) => p.sessionId === lobby.ownerSessionId);
  const isOwner = callerSessionId === lobby.ownerSessionId;
  const showRoleSlots = isOwner || lobby.config.showConfigToPlayers;
  return {
    id: lobby.id,
    ownerPlayerId: owner?.id ?? "",
    players: lobby.players.map((p) => ({ id: p.id, name: p.name })),
    playerOrder: lobby.playerOrder,
    config: {
      gameMode: lobby.config.gameMode,
      roleConfigMode: lobby.config.roleConfigMode,
      showConfigToPlayers: lobby.config.showConfigToPlayers,
      showRolesInPlay: lobby.config.showRolesInPlay,
      timerConfig: lobby.config.timerConfig,
      modeConfig: lobby.config.modeConfig,
      ...(showRoleSlots ? { roleSlots: lobby.config.roleSlots } : {}),
    } as GameConfig,
    readyPlayerIds: lobby.readyPlayerIds,
    ...(lobby.gameId && { gameId: lobby.gameId }),
  };
}
