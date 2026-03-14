import type {
  GameStatusState,
  GameMode,
  RoleSlot,
  Team,
  TimerConfig,
} from "@/lib/types";
import type { NightAction } from "@/lib/game-modes/werewolf";
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
  /** All night targets keyed by roleId. Only populated for the narrator/owner. */
  nightActions?: Record<string, NightAction>;
  /** The current player's role's night target (playerId). Only populated for non-owner players during nighttime. */
  myNightTarget?: string;
  /** Whether the player has confirmed their night target. */
  myNightTargetConfirmed?: boolean;
  /** Whether this player has been marked as dead by the narrator. */
  amDead?: boolean;
  /** Player IDs marked as dead by the narrator. */
  deadPlayerIds?: string[];
  /** Phase timer configuration. Only populated for the game owner. */
  timerConfig?: TimerConfig;
}
