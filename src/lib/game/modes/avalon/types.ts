// ---------------------------------------------------------------------------
// Quest card types
// ---------------------------------------------------------------------------

export enum QuestCard {
  Success = "success",
  Fail = "fail",
}

// ---------------------------------------------------------------------------
// Phase enum
// ---------------------------------------------------------------------------

export enum AvalonPhase {
  TeamProposal = "team-proposal",
  TeamVote = "team-vote",
  Quest = "quest",
  Assassination = "assassination",
}

// ---------------------------------------------------------------------------
// Phase types (discriminated union members)
// ---------------------------------------------------------------------------

/** Quest Leader selects team members for the quest. */
export interface TeamProposalPhase {
  type: AvalonPhase.TeamProposal;
  leaderId: string;
  questNumber: number;
  teamSize: number;
  proposedTeam?: string[];
}

/** All players vote to approve or reject the proposed team. */
export interface TeamVotePhase {
  type: AvalonPhase.TeamVote;
  leaderId: string;
  proposedTeam: string[];
  votes: { playerId: string; vote: "approve" | "reject" }[];
  /** Set once all votes are cast. True if approvals strictly exceed rejections. */
  passed?: boolean;
}

/** Approved team members play Success or Fail cards. */
export interface QuestPhase {
  type: AvalonPhase.Quest;
  teamPlayerIds: string[];
  cards: { playerId: string; card: QuestCard }[];
  /** Number of Fail cards played. Set once all cards are submitted. */
  failCount?: number;
  /** Set once the quest is resolved. */
  succeeded?: boolean;
}

/** The Assassin attempts to identify and eliminate Merlin. */
export interface AssassinationPhase {
  type: AvalonPhase.Assassination;
  assassinPlayerId: string;
  targetPlayerId?: string;
  /** Set once the assassination is resolved. True if Merlin was correctly identified. */
  correct?: boolean;
}

// ---------------------------------------------------------------------------
// Turn phase union
// ---------------------------------------------------------------------------

export type AvalonTurnPhase =
  | TeamProposalPhase
  | TeamVotePhase
  | QuestPhase
  | AssassinationPhase;

// ---------------------------------------------------------------------------
// Quest outcome
// ---------------------------------------------------------------------------

export interface QuestResult {
  questNumber: number;
  teamSize: number;
  failCount: number;
  succeeded: boolean;
}

// ---------------------------------------------------------------------------
// Turn state
// ---------------------------------------------------------------------------

export interface AvalonTurnState {
  /** Current quest number (1–5). */
  questNumber: number;
  /** Current game phase. */
  phase: AvalonTurnPhase;
  /** Fixed player rotation order for the Quest Leader (player IDs). */
  leaderOrder: string[];
  /** Index into leaderOrder for the current Quest Leader. */
  currentLeaderIndex: number;
  /** Outcomes of completed quests. */
  questResults: QuestResult[];
  /** Number of consecutive team vote rejections. Resets on approval; 5 = Evil wins. */
  consecutiveRejections: number;
  /** Array of 5 team sizes based on player count. */
  questTeamSizes: [number, number, number, number, number];
  /** Quest indices (0-based) that require 2 Fail cards to fail (Quest 4 at 7+ players). */
  requiresTwoFails: number[];
}
