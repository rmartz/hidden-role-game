import type {
  GameStatusState,
  GameMode,
  RoleSlot,
  Team,
  TimerConfig,
} from "@/lib/types";
import type { AnyNightAction, TargetCategory } from "@/lib/game-modes/werewolf";
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
  gameOwner?: PublicLobbyPlayer;
  /** The current player's own player ID. Undefined for the narrator/owner. */
  myPlayerId?: string;
  myRole?: PublicRoleInfo;
  visibleRoleAssignments: VisibleTeammate[];
  rolesInPlay?: RoleInPlay[];
  /** All night targets keyed by phase key. Only populated for the narrator/owner. */
  nightActions?: Record<string, AnyNightAction>;
  /** The current player's night target (playerId). Only populated for non-owner players during nighttime. */
  myNightTarget?: string;
  /** Whether the player has confirmed their night target. */
  myNightTargetConfirmed?: boolean;
  /** Per-player votes from teammates during a team night phase. */
  teamVotes?: { playerName: string; targetPlayerId: string }[];
  /** The most-voted target during a team night phase. */
  suggestedTargetId?: string;
  /** Whether all alive team members agree on the same target. */
  allAgreed?: boolean;
  /** Whether this player has been marked as dead by the narrator. */
  amDead?: boolean;
  /** Player IDs marked as dead by the narrator. */
  deadPlayerIds?: string[];
  /**
   * Sanitized night outcomes shown to players at the start of the day.
   * Only includes events where something happened (e.g. a death).
   * Omits who performed the action and any negated/blocked actions.
   * Only populated for non-owner players during daytime.
   */
  nightSummary?: { targetPlayerId: string; died: boolean }[];
  /**
   * The target the player chose during the preceding night.
   * Present even if the action was negated, so players can confirm
   * their input was recorded. Only populated for non-owner players during daytime.
   */
  myLastNightAction?: { targetPlayerId: string; category: TargetCategory };
  /**
   * Investigation result for the Seer during nighttime.
   * Only populated after the narrator explicitly reveals it.
   */
  investigationResult?: { targetPlayerId: string; isWerewolfTeam: boolean };
  /**
   * Player IDs currently attacked but not yet protected.
   * Only populated for the Witch during her night phase, before she acts.
   */
  attackedPlayerIds?: string[];
  /** Whether the Witch has already used her once-per-game special ability. */
  witchAbilityUsed?: boolean;
  /**
   * Player IDs silenced by the Spellcaster during the preceding night.
   * Visible to all players during daytime.
   */
  silencedPlayerIds?: string[];
  /** Phase timer configuration. Present when the lobby has timers enabled. */
  timerConfig?: TimerConfig;
}
