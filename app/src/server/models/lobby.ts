import type { GameMode, RoleSlot } from "@/lib/models";

export interface PublicLobbyPlayer {
  id: string;
  name: string;
}

export interface PublicLobby {
  id: string;
  ownerPlayerId: string;
  players: PublicLobbyPlayer[];
  gameMode: GameMode;
  showConfigToPlayers: boolean;
  showRolesInPlay: boolean;
  roleSlots?: RoleSlot[];
  gameId?: string;
}

export interface CreateLobbyRequest {
  playerName: string;
}

export interface JoinLobbyRequest {
  playerName: string;
}

export interface UpdateLobbyConfigRequest {
  showConfigToPlayers?: boolean;
  showRolesInPlay?: boolean;
  gameMode?: GameMode;
  roleSlots?: RoleSlot[];
}

export interface LobbyJoinResponse {
  lobby: PublicLobby;
  sessionId: string;
  playerId: string;
}
