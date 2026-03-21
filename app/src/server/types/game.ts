import type {
  GameStatusState,
  GameMode,
  RoleSlot,
  Team,
  TimerConfig,
} from "@/lib/types";
import type { AnyNightAction, DaytimeVote } from "@/lib/game-modes/werewolf";
import type { PublicLobbyPlayer } from "./lobby";

export type { RoleSlot };

export interface CreateGameRequest {
  lobbyId: string;
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

export type VisibilityReason = "wake-partner" | "aware-of" | "revealed";

export interface VisibleTeammate {
  player: PublicLobbyPlayer;
  reason: VisibilityReason;
  /** Only present when the exact role is known (e.g., dead player reveal by narrator). */
  role?: PublicRoleInfo;
}

/** Night effects visible during the daytime summary. */
export interface DaytimeNightStatusEntry {
  targetPlayerId: string;
  effect: "killed" | "silenced" | "hypnotized" | "smited" | "survived";
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
  /** The lobby this game was started from. Used for returning to the lobby after the game ends. */
  lobbyId: string;
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
   * For roles with preventRepeatTarget, the player ID that cannot be targeted
   * this night (was targeted last night). Shown as disabled in the UI.
   * Only populated for non-owner players during their nighttime phase.
   */
  previousNightTargetId?: string;
  /**
   * Investigation result for Investigate-category roles during nighttime.
   * Only populated after the narrator explicitly reveals it.
   * - Seer / One-Eyed Seer: isWerewolfTeam reflects the isWerewolf flag.
   * - Wizard: isWerewolfTeam reflects whether target is the Seer; resultLabel overrides display.
   * - Mystic Seer / Mentalist: resultLabel contains the human-readable result.
   */
  investigationResult?: {
    targetPlayerId: string;
    isWerewolfTeam: boolean;
    /** When present, overrides the default "is/is not a Werewolf" display text. */
    resultLabel?: string;
    /** For Mentalist: the second target's player name (used in display). */
    secondTargetName?: string;
  };
  /**
   * One-Eyed Seer: set when the player is locked onto a detected Werewolf.
   * The player cannot select a new investigation target until this player is eliminated.
   */
  oneEyedSeerLockedTargetId?: string;
  /** Elusive Seer: player IDs of all Villagers in the game, shown on the first night. */
  elusiveSeerVillagerIds?: string[];
  /** Role publicly revealed by the Exposer. Shown to all players once set. */
  exposerReveal?: { playerName: string; roleName: string; team: Team };
  /** For Mentalist: the player's second night target. */
  mySecondNightTarget?: string;
  /** Whether the Witch has already used their once-per-game special ability. */
  witchAbilityUsed?: boolean;
  /** Whether the Exposer has already used their once-per-game reveal ability. */
  exposerAbilityUsed?: boolean;
  /** Whether the Priest's ward is currently active (cannot target this night). */
  priestWardActive?: boolean;
  /**
   * Altruist sacrifice event: shown to all players at day start when the Altruist
   * intercepted a kill. Both the Altruist and the saved player are identified.
   */
  altruistSave?: { altruistPlayerId: string; savedPlayerId: string };
  /** Phase timer configuration. */
  timerConfig: TimerConfig;
  /** Whether player nominations for trial are enabled in this game. */
  nominationsEnabled: boolean;
  /** When true, only one trial is allowed per day phase. */
  singleTrialPerDay: boolean;
  /**
   * Current nominations for trial, grouped by defendant with nominator IDs.
   * Only populated during daytime when nominationsEnabled is true.
   */
  nominations?: { defendantId: string; nominatorIds: string[] }[];
  /** The defendant this player has nominated, if any. */
  myNominatedDefendantId?: string;
  /** True if the player is silenced this day (cannot nominate or vote). */
  isSilenced?: boolean;
  /** True if the player is hypnotized by the Mummy (vote follows the Mummy). */
  isHypnotized?: boolean;
  /** Active elimination trial. Sanitized view: no raw per-player vote breakdown. */
  activeTrial?: {
    defendantId: string;
    startedAt: number;
    /** Current phase of the trial: defense speech or voting. */
    phase: "defense" | "voting";
    /** Unix epoch ms when the voting phase began. */
    voteStartedAt?: number;
    myVote?: DaytimeVote;
    voteCount: number;
    playerCount: number;
    verdict?: "eliminated" | "innocent";
    /** When true, this player's role forces them to vote guilty. */
    mustVoteGuilty?: boolean;
    /** When true, this player's role forces them to vote innocent. */
    mustVoteInnocent?: boolean;
    /** Per-player vote results, populated once verdict is set. */
    voteResults?: { playerName: string; vote: DaytimeVote }[];
    /** Role of the eliminated player, populated when verdict is "eliminated". */
    eliminatedRole?: { id: string; name: string; team: Team };
  };
}
