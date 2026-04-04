import type { PlayerGameState } from "@/server/types/game";
import type {
  SecretVillainPhase,
  SpecialActionType,
  ElectionVote,
} from "./types";

/**
 * Secret Villain–specific extension of PlayerGameState. Includes all fields
 * that only exist in Secret Villain games. Components receiving SV game state
 * should type their props as SecretVillainPlayerGameState.
 */
export interface SecretVillainPlayerGameState extends PlayerGameState {
  /** Current phase info (type, presidentId, etc.). */
  svPhase?: {
    type: SecretVillainPhase;
    presidentId: string;
    chancellorNomineeId?: string;
    chancellorId?: string;
    actionType?: SpecialActionType;
  };
  /** Board state: Good and Bad cards played, failed election count. */
  svBoard?: {
    goodCardsPlayed: number;
    badCardsPlayed: number;
    failedElectionCount: number;
  };
  /** President's drawn cards, chancellor's remaining cards, or peeked cards. */
  policyCards?: {
    drawnCards?: string[];
    remainingCards?: string[];
    discardedCard?: string;
    peekedCards?: string[];
    vetoProposed?: boolean;
    vetoResponse?: boolean;
  };
  /** Veto proposal visible to the president. */
  vetoProposal?: {
    vetoProposed: boolean;
    vetoResponse?: boolean;
  };
  /** Eligible chancellor IDs (president only, nomination phase). */
  eligibleChancellorIds?: string[];
  /** The player's own election vote (during or after voting). */
  myElectionVote?: ElectionVote;
  /** All election votes (after resolution). */
  electionVotes?: { playerId: string; vote: ElectionVote }[];
  /** Whether the election passed. */
  electionPassed?: boolean;
  /** Whether veto power is unlocked (4+ Bad cards). */
  vetoUnlocked?: boolean;
  /** Investigation result (president only). */
  svInvestigationResult?: {
    targetPlayerId: string;
    team: string;
  };
  /** True when this player is the investigation target and needs to consent. */
  svInvestigationConsent?: boolean;
  /** Player ID the president is waiting on for investigation consent. */
  svInvestigationWaitingForPlayerId?: string;
}
