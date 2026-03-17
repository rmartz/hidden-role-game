import type {
  GameMode,
  RoleSlot,
  RoleConfigMode,
  ShowRolesInPlay,
  TimerConfig,
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
  timerConfig?: TimerConfig;
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
  gameMode?: GameMode;
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
  timerConfig?: TimerConfig;
}

export interface LobbyJoinResponse {
  lobby: PublicLobby;
  sessionId: string;
  playerId: string;
}
