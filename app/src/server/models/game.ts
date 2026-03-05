import type { GameStatusState, Team } from "@/lib/models";
import type { PublicLobbyPlayer } from "./lobby";

export interface RoleSlot {
  roleId: string;
  count: number;
}

export interface CreateGameRequest {
  lobbyId: string;
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
