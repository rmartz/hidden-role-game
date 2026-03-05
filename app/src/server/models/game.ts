import type { GameStatusState, Team } from "@/lib/models";

export interface PublicLobbyPlayer {
  id: string;
  name: string;
}

export interface PublicLobby {
  id: string;
  ownerPlayerId: string;
  players: PublicLobbyPlayer[];
  game?: { status: GameStatusState; players: PublicLobbyPlayer[] };
}

export interface CreateLobbyRequest {
  playerName: string;
}

export interface JoinLobbyRequest {
  playerName: string;
}

export interface LobbyJoinResponse {
  lobby: PublicLobby;
  sessionId: string;
  playerId: string;
}

export interface RoleSlot {
  roleId: string;
  count: number;
}

export interface StartGameRequest {
  roleSlots: RoleSlot[];
}

export interface PublicRoleInfo {
  id: string;
  name: string;
  team: Team;
}

export interface VisibleTeammate {
  player: PublicLobbyPlayer;
  role: PublicRoleInfo;
}

export interface PlayerGameState {
  status: GameStatusState;
  players: PublicLobbyPlayer[];
  myRole: PublicRoleInfo;
  visibleTeammates: VisibleTeammate[];
}
