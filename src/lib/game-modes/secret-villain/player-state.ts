import { GameMode } from "@/lib/types";
import type { BasePlayerGameState } from "@/server/types/game";
import type {
  SecretVillainPhase,
  SpecialActionType,
  ElectionVote,
} from "./types";
import type { SecretVillainTimerConfig } from "./timer-config";

/** Current Secret Villain phase info visible to all players. */
export interface SvPhaseInfo {
  type: SecretVillainPhase;
  presidentId: string;
  chancellorNomineeId?: string;
  chancellorId?: string;
  actionType?: SpecialActionType;
  /** Unix epoch ms when the current phase started (for timer display). */
  startedAt?: number;
}

/** Board state: policy cards played and failed election count. */
export interface SvBoardState {
  goodCardsPlayed: number;
  badCardsPlayed: number;
  failedElectionCount: number;
}

/** Policy card state visible to the president or chancellor. */
export interface SvPolicyCardsState {
  drawnCards?: string[];
  remainingCards?: string[];
  discardedCard?: string;
  peekedCards?: string[];
  vetoProposed?: boolean;
  vetoResponse?: boolean;
}

/** Veto proposal state visible to the president. */
export interface SvVetoProposalState {
  vetoProposed: boolean;
  vetoResponse?: boolean;
}

/** A single player's election vote. */
export interface SvElectionVoteEntry {
  playerId: string;
  vote: ElectionVote;
}

/** Investigation result visible to the president. */
export interface SvInvestigationResult {
  targetPlayerId: string;
  team: string;
}

/**
 * Secret Villain–specific extension of PlayerGameState. Includes all fields
 * that only exist in Secret Villain games. Components receiving SV game state
 * should type their props as SecretVillainPlayerGameState.
 */
export interface SecretVillainPlayerGameState extends BasePlayerGameState {
  gameMode: GameMode.SecretVillain;
  /** Override base timerConfig with Secret Villain–specific timer fields. */
  timerConfig: SecretVillainTimerConfig;
  /** Current phase info (type, presidentId, etc.). */
  svPhase?: SvPhaseInfo;
  /** Board state: Good and Bad cards played, failed election count. */
  svBoard?: SvBoardState;
  /** President's drawn cards, chancellor's remaining cards, or peeked cards. */
  policyCards?: SvPolicyCardsState;
  /** Veto proposal visible to the president. */
  vetoProposal?: SvVetoProposalState;
  /** Eligible chancellor IDs (president only, nomination phase). */
  eligibleChancellorIds?: string[];
  /** The player's own election vote (during or after voting). */
  myElectionVote?: ElectionVote;
  /** All election votes (after resolution). */
  electionVotes?: SvElectionVoteEntry[];
  /** Number of votes cast so far. */
  electionVoteCount?: number;
  /** Player IDs who have voted (not how they voted — votes are secret until tally). */
  votedPlayerIds?: string[];
  /** Whether the election passed. */
  electionPassed?: boolean;
  /** Whether veto power is unlocked (4+ Bad cards). */
  vetoUnlocked?: boolean;
  /** Investigation result (president only). */
  svInvestigationResult?: SvInvestigationResult;
  /** True when this player is the investigation target and needs to consent. */
  svInvestigationConsent?: boolean;
  /** Player ID the president is waiting on for investigation consent. */
  svInvestigationWaitingForPlayerId?: string;
}
