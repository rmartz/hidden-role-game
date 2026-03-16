import type {
  GameStatusState,
  GameMode,
  RoleSlot,
  Team,
  TimerConfig,
} from "@/lib/types";
import type { AnyNightAction } from "@/lib/game-modes/werewolf";
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

/** Night effects visible during the daytime summary. */
export interface DaytimeNightStatusEntry {
  targetPlayerId: string;
  effect: "killed" | "silenced";
}

/** Night effects visible to the Witch during their nighttime phase only. */
export interface NighttimeNightStatusEntry {
  targetPlayerId: string;
  effect: "attacked";
}

export type NightStatusEntry =
  | DaytimeNightStatusEntry
  | NighttimeNightStatusEntry;

export interface PlayerGameState {
  status: GameStatusState;
  gameMode: GameMode;
  players: PublicLobbyPlayer[];
  gameOwner?: PublicLobbyPlayer;
  /** The current player's own player ID. Undefined for the narrator/owner. */
  myPlayerId?: string;
  myRole?: PublicRoleInfo;
  visibleRoleAssignments: VisibleTeammate[];
  rolesInPlay?: RoleInPlay[];
  /** All night targets keyed by phase key. Only populated for the narrator/owner. */
  nightActions?: Record<string, AnyNightAction>;
  /**
   * The current player's night target (playerId). null = intentional skip;
   * undefined = no decision made yet. Only populated for non-owner players during nighttime.
   */
  myNightTarget?: string | null;
  /** Whether the player has confirmed their night target. */
  myNightTargetConfirmed?: boolean;
  /** Per-player votes from teammates during a team night phase. */
  teamVotes?: (
    | { playerName: string; targetPlayerId: string }
    | { playerName: string; skipped: true }
  )[];
  /** The most-voted target during a group night phase. */
  suggestedTargetId?: string;
  /** Whether all alive group members agree on the same target. */
  allAgreed?: boolean;
  /** Whether this player has been marked as dead by the narrator. */
  amDead?: boolean;
  /** Player IDs marked as dead by the narrator. */
  deadPlayerIds?: string[];
  /**
   * Night effect outcomes visible to players. During daytime: killed/silenced
   * entries from the preceding night. During nighttime for the Witch: attacked
   * entries showing players currently under attack before they act.
   * Only populated for non-owner players.
   */
  nightStatus?: NightStatusEntry[];
  /**
  /**
   * For roles with preventRepeatTarget, the player ID that cannot be targeted
   * this night (was targeted last night). Shown as disabled in the UI.
   * Only populated for non-owner players during their nighttime phase.
   */
  previousNightTargetId?: string;
  /**
   * Investigation result for the Seer during nighttime.
   * Only populated after the narrator explicitly reveals it.
   */
  investigationResult?: { targetPlayerId: string; isWerewolfTeam: boolean };
  /** Whether the Witch has already used their once-per-game special ability. */
  witchAbilityUsed?: boolean;
  /** Phase timer configuration. Present when the lobby has timers enabled. */
  timerConfig?: TimerConfig;
}
