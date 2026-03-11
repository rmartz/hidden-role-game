import type {
  GameMode,
  RoleSlot,
  RoleConfigMode,
  ShowRolesInPlay,
} from "@/lib/types";

export interface PublicLobbyPlayer {
  id: string;
  name: string;
}

export interface GameConfig {
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  showConfigToPlayers: boolean;
  showRolesInPlay: ShowRolesInPlay;
  roleSlots?: RoleSlot[];
}

export interface PublicLobby {
  id: string;
  ownerPlayerId: string;
  players: PublicLobbyPlayer[];
  config: GameConfig;
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
  showRolesInPlay?: ShowRolesInPlay;
  roleConfigMode?: RoleConfigMode;
  gameMode?: GameMode;
  roleSlots?: RoleSlot[];
}

export interface LobbyJoinResponse {
  lobby: PublicLobby;
  sessionId: string;
  playerId: string;
}
