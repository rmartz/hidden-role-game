import type { Team } from "@/lib/types";
import type { WerewolfTimerConfig } from "./timer-config";
import { GameMode } from "@/lib/types";
import type {
  BasePlayerGameState,
  NightStatusEntry,
} from "@/server/types/game";
import type { AnyNightAction, DaytimeVote } from "./types";

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
  /** When true, only one trial is allowed per day phase. */
  singleTrialPerDay: boolean;
  /** When true, the night summary reveals players who were attacked but saved by protection. */
  revealProtections: boolean;
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
  /** Role publicly revealed by the Exposer. */
  exposerReveal?: { playerName: string; roleName: string; team: Team };
  /** Mentalist: second night target. */
  mySecondNightTarget?: string;
  /** Whether the Witch has used their once-per-game ability. */
  witchAbilityUsed?: boolean;
  /** Whether the Exposer has used their once-per-game ability. */
  exposerAbilityUsed?: boolean;
  /** Whether the Mortician has completed their mission. */
  morticianAbilityEnded?: boolean;
  /** Whether the Priest's ward is active this night. */
  priestWardActive?: boolean;
  /** Whether the Mirrorcaster is charged (Attack mode). */
  mirrorcasterCharged?: boolean;
  /** Executioner: target player ID. */
  executionerTargetId?: string;
  /** Hunter revenge pending: the Hunter's player ID. Narrator-only. */
  hunterRevengePlayerId?: string;
  /**
   * Role IDs that were randomly removed from the game at start (Narrator-only).
   * Present only when hiddenRoleCount > 0 in modeConfig.
   */
  hiddenRoleIds?: string[];
  /** Current nominations for trial. */
  nominations?: { defendantId: string; nominatorIds: string[] }[];
  /** The defendant this player has nominated. */
  myNominatedDefendantId?: string;
  /** True if the player is silenced this day. */
  isSilenced?: boolean;
  /** True if the player is hypnotized by the Mummy. */
  isHypnotized?: boolean;
  /** Active elimination trial. */
  activeTrial?: {
    defendantId: string;
    startedAt: number;
    phase: "defense" | "voting";
    voteStartedAt?: number;
    myVote?: DaytimeVote;
    voteCount: number;
    playerCount: number;
    verdict?: "eliminated" | "innocent";
    mustVoteGuilty?: boolean;
    mustVoteInnocent?: boolean;
    voteResults?: { playerName: string; vote: DaytimeVote }[];
    eliminatedRole?: { id: string; name: string; team: Team };
  };
}
