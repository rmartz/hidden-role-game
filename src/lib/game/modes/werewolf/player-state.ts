import type { Team } from "@/lib/types";
import type { GameMode } from "@/lib/types";
import type {
  BasePlayerGameState,
  NightStatusEntry,
} from "@/server/types/game";

import type { WerewolfTimerConfig } from "./timer-config";
import type { AnyNightAction } from "./types";
import type { DaytimeVote, TrialPhase, TrialVerdict } from "./types";

/**
 * Werewolf-specific extension of PlayerGameState. Includes all fields that
 * only exist in Werewolf games. Components receiving Werewolf game state
 * should type their props as WerewolfPlayerGameState.
 */
export interface WerewolfPlayerGameState extends BasePlayerGameState {
  gameMode: GameMode.Werewolf;
  /** Override base timerConfig with Werewolf-specific timer fields. */
  timerConfig: WerewolfTimerConfig;
  /** Whether player nominations for trial are enabled in this game. */
  nominationsEnabled: boolean;
  /** Maximum number of trials allowed per day phase. undefined means unlimited. */
  trialsPerDay?: number;
  /** Number of trials that have concluded this day phase. */
  concludedTrialsCount?: number;
  /** When true, the night summary reveals players who were attacked but saved by protection. */
  revealProtections: boolean;
  /**
   * When true, elimination/status outcomes (killed/silenced/hypnotized) are
   * revealed to all players immediately at day start.
   */
  autoRevealNightOutcome: boolean;
  /** All night targets keyed by phase key. Only populated for the narrator/owner. */
  nightActions?: Record<string, AnyNightAction>;
  /** The current player's night target. null = intentional skip; undefined = no decision. */
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
  /** Night effect outcomes visible to players (daytime summary or Witch nighttime view). */
  nightStatus?: NightStatusEntry[];
  /** Player ID that cannot be targeted this night (preventRepeatTarget). */
  previousNightTargetId?: string;
  /** Investigation result for Investigate-category roles. */
  investigationResult?: {
    targetPlayerId: string;
    isWerewolfTeam: boolean;
    resultLabel?: string;
    secondTargetName?: string;
  };
  /** One-Eyed Seer: locked investigation target. */
  oneEyedSeerLockedTargetId?: string;
  /** Elusive Seer: player IDs of all Villagers. */
  elusiveSeerVillagerIds?: string[];
  /** Illuminati: full list of all player role assignments (revealed by narrator on night 1). */
  illuminatiRoleAssignments?: {
    playerId: string;
    roleName: string;
    team: Team;
  }[];
  /** Mentalist: second night target. */
  mySecondNightTarget?: string;
  /** Whether the Witch has used their once-per-game ability. */
  witchAbilityUsed?: boolean;
  /** Whether the Exposer has used their once-per-game ability. */
  exposerAbilityUsed?: boolean;
  /** Whether the Mortician has completed their mission. */
  morticianAbilityEnded?: boolean;
  /** Public list of players knighted by the Monarch. */
  monarchKnightedPlayerIds?: string[];
  /** Number of times the Monarch has knighted a player (max 3). */
  monarchKnightingsUsed?: number;
  /** Whether the Priest's ward is active this night. */
  priestWardActive?: boolean;
  /** Whether the Mirrorcaster is charged (Attack mode). */
  mirrorcasterCharged?: boolean;
  /**
   * The Evil Empath's last adjacency result, revealed to Werewolves upon
   * the Evil Empath's death. True = Seer was adjacent to a Werewolf.
   */
  evilEmpathRevealedResult?: boolean;
  /**
   * The Evil Empath's own nightly adjacency result, visible only to the Evil Empath.
   * True = Seer is adjacent to a Werewolf this night.
   */
  evilEmpathNightResult?: boolean;
  /** Whether the Mercenary is charged (Bribe mode). */
  mercenaryCharged?: boolean;
  /** Player IDs that the Mercenary has bribed. Narrator-only. */
  mercenaryBribedPlayerIds?: string[];
  /** Whether the Mercenary also won alongside the main winner. */
  mercenaryAlsoWins?: boolean;
  /** Executioner: target player ID. */
  executionerTargetId?: string;
  /** Whether the Alpha Wolf has used their once-per-game bite ability. */
  alphaWolfBiteUsed?: boolean;
  /**
   * Players whose roles have been changed mid-game (Alpha Wolf bite).
   * Visible to Werewolf-team players so they know who was converted.
   */
  roleConversions?: { playerId: string; newRoleDefinitionId: string }[];
  /**
   * True when the player was tapped by The Thing this night.
   * Present only for the tapped player; cleared each night.
   */
  thingTappedMe?: boolean;
  /** The Thing: the player ID the Thing chose to tap this night. */
  thingTappedPlayerId?: string;
  /** Insomniac: whether each neighbor woke and acted this night. */
  insomniacResult?: { leftActed: boolean; rightActed: boolean };
  /** The Count: werewolf counts in each half of the table (night 1 only). */
  countResult?: { leftCount: number; rightCount: number };
  /**
   * Adjacent player IDs available to target for roles with `adjacentTargetOnly`.
   * Sent to The Thing so the client can restrict target selection.
   */
  adjacentPlayerIds?: string[];
  /** Hunter revenge pending: the Hunter's player ID. Narrator-only. */
  hunterRevengePlayerId?: string;
  /**
   * Ghost clues submitted by the Ghost player, visible to all during daytime.
   * Each entry records the turn number and clue text.
   */
  ghostClues?: { turn: number; clue: string }[];
  /**
   * True when the player is the Ghost and has already submitted a clue this turn.
   * Used to disable the clue submission UI.
   */
  ghostClueSubmittedThisTurn?: boolean;
  /**
   * True when this player is the Ghost — enables the nighttime observer view
   * with narrator-level visibility into all night actions.
   */
  ghostVisible?: boolean;
  /**
   * Role IDs that were randomly removed from the game at start (Narrator-only).
   * Present only when hiddenRoleCount > 0 in modeConfig.
   */
  hiddenRoleIds?: string[];
  /** Current nominations for trial. */
  nominations?: { defendantId: string; nominatorIds: string[] }[];
  /** The defendant this player has nominated. */
  myNominatedDefendantId?: string;
  /** Player IDs pending elimination at the end of the next night (narrator daytime smite). */
  pendingSmitePlayerIds?: string[];
  /** Arsonist: player IDs that have been doused by the Arsonist. */
  arsonistDousedPlayerIds?: string[];
  /**
   * Convicted player ID awaiting final elimination during the post-verdict
   * Martyr window. Populated for all players so the UI can present the window.
   * Cleared when the Martyr intercepts or the narrator advances past it.
   */
  pendingGuiltId?: string;
  /** True once the Martyr has used their once-per-game substitution ability. */
  martyrUsed?: boolean;
  /** True if the player is silenced this day. */
  isSilenced?: boolean;
  /** True if the player is hypnotized by the Mummy. */
  isHypnotized?: boolean;
  /** Number of nights the Veteran has chosen to Alert so far this game. */
  veteranAlertsUsed?: number;
  /** Whether the Veteran has chosen to go on Alert this night (Veteran-only). */
  myNightAlerted?: boolean;
  /** Active elimination trial. */
  activeTrial?: {
    defendantId: string;
    startedAt: number;
    phase: TrialPhase;
    voteStartedAt?: number;
    /** Unix epoch ms when the narrator paused the active trial timer. Absent when running. */
    pausedAt?: number;
    /** Accumulated elapsed milliseconds from prior running segments, carried into this one on resume. */
    pauseOffset?: number;
    myVote?: DaytimeVote;
    voteCount: number;
    playerCount: number;
    verdict?: TrialVerdict;
    mustVoteGuilty?: boolean;
    mustVoteInnocent?: boolean;
    voteResults?: { playerName: string; vote: DaytimeVote }[];
    eliminatedRole?: { id: string; name: string; team: Team };
    /**
     * True when the defendant was actually eliminated (added to `deadPlayerIds`).
     * False when the defendant survived (e.g. Martyr intercept).
     * Only set when `verdict` is present.
     */
    defendantEliminated?: boolean;
  };
}

/**
 * Returns true when no new nominations can be started — either a trial is
 * active (no verdict yet), the Martyr window is open (pendingGuiltId set),
 * or the per-day trial cap has been reached.
 */
export function isNominationsBlocked(
  gameState: WerewolfPlayerGameState,
): boolean {
  const hasActiveTrial =
    (!!gameState.activeTrial && !gameState.activeTrial.verdict) ||
    !!gameState.pendingGuiltId;
  return (
    hasActiveTrial ||
    (gameState.trialsPerDay !== undefined &&
      (gameState.concludedTrialsCount ?? 0) >= gameState.trialsPerDay)
  );
}
