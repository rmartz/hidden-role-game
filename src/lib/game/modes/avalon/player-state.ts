import { GameMode } from "@/lib/types";
import type { BasePlayerGameState } from "@/server/types/game";
import type { AvalonPhase, QuestResult, TeamVote, QuestCard } from "./types";

/** Current quest info visible to all players. */
export interface AvalonCurrentQuest {
  questNumber: number;
  teamSize: number;
  requiresTwoFails: boolean;
}

/**
 * Public phase info sent to clients — contains only the fields that are safe
 * for all players to see. This is a stripped version of `AvalonTurnPhase`
 * (similar to `SvPhaseInfo` in Secret Villain).
 */
export interface AvalonPublicPhase {
  type: AvalonPhase;
  /** Present during TeamProposal, TeamVote, and Quest phases. */
  leaderId?: string;
  /** Size of the team being proposed (TeamProposal only). */
  teamSize?: number;
  /** Player IDs on the active quest team (Quest phase only). */
  teamPlayerIds?: string[];
  /** Player ID of the Assassin (Assassination phase only). */
  assassinPlayerId?: string;
}

/**
 * Avalon-specific extension of PlayerGameState. Includes all fields that only
 * exist in Avalon games.
 */
export interface AvalonPlayerGameState extends BasePlayerGameState {
  gameMode: GameMode.Avalon;
  /** Outcomes of completed quests. */
  questResults?: QuestResult[];
  /** Current quest number, team size, and double-fail rule. */
  currentQuest?: AvalonCurrentQuest;
  /** Current phase info (type, leaderId, team, etc.). */
  avalonPhase?: AvalonPublicPhase;
  /** Proposed team player IDs (during proposal/vote phases). */
  proposedTeam?: string[];
  /** This player's approve/reject team vote. */
  myTeamVote?: TeamVote;
  /** All votes after team vote resolution. */
  teamVotes?: { playerId: string; vote: TeamVote }[];
  /** Whether the team vote passed. */
  teamVotePassed?: boolean;
  /** Number of consecutive team vote rejections. */
  consecutiveRejections?: number;
  /** This player's played quest card (team members only, after playing). */
  myQuestCard?: QuestCard;
  /** Number of Fail cards played (after quest resolution). */
  questFailCount?: number;
  /** Assassin's selected assassination target player ID. */
  assassinationTarget?: string;
  /** Player IDs eligible to be on the quest team (Quest Leader only, during proposal). */
  eligibleTeamMemberIds?: string[];
  /** All player IDs that are valid assassination targets (Assassin only, during assassination). */
  assassinationTargetIds?: string[];
}
