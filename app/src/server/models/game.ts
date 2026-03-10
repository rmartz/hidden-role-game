import type { GameStatusState, GameMode, RoleSlot, Team } from "@/lib/models";
import type { PublicLobbyPlayer } from "./lobby";

export type { RoleSlot };

export interface CreateGameRequest {
  lobbyId: string;
  roleSlots: RoleSlot[];
  gameMode: GameMode;
}

export interface PublicRoleInfo {
  id: string;
  name: string;
  team: Team;
}

export interface RoleInPlay {
  id: string;
  name: string;
  team: Team;
  /** Configured minimum count for this role. */
  min: number;
  /** Configured maximum count for this role. */
  max: number;
  /** Actual assigned count. Only present for RoleAndCount mode. */
  count?: number;
}

export interface VisibleTeammate {
  player: PublicLobbyPlayer;
  role: PublicRoleInfo;
}

export interface PlayerGameState {
  status: GameStatusState;
  gameMode: GameMode;
  players: PublicLobbyPlayer[];
  gameOwner: PublicLobbyPlayer | null;
  myRole: PublicRoleInfo | null;
  visibleRoleAssignments: VisibleTeammate[];
  rolesInPlay: RoleInPlay[] | null;
}
