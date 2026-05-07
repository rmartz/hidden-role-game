import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { AvalonPhase, TeamVote } from "../types";
import type { AvalonTurnState } from "../types";

function currentTurnState(game: Game): AvalonTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as AvalonTurnState | undefined;
}

const CONSECUTIVE_REJECTION_LIMIT = 5;

/**
 * Tally all votes on the current team vote and set `passed` on the phase.
 * Approvals strictly greater than rejections = passed.
 */
export function tallyTeamVote(game: Game): void {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== AvalonPhase.TeamVote) return;
  if (ts.phase.passed !== undefined) return;

  const approvals = ts.phase.votes.filter(
    (v) => v.vote === TeamVote.Approve,
  ).length;
  const rejections = ts.phase.votes.filter(
    (v) => v.vote === TeamVote.Reject,
  ).length;
  ts.phase.passed = approvals > rejections;
}

/**
 * Advance from a resolved team vote to the next phase.
 * - Approved: transition to Quest phase.
 * - Rejected: increment consecutiveRejections. If >= limit, Evil wins.
 *   Otherwise rotate leader and return to TeamProposal.
 */
export function advanceFromTeamVote(game: Game): void {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== AvalonPhase.TeamVote) return;

  const votePhase = ts.phase;
  if (votePhase.passed === undefined) return;

  if (votePhase.passed) {
    ts.consecutiveRejections = 0;
    ts.phase = {
      type: AvalonPhase.Quest,
      leaderId: votePhase.leaderId,
      teamPlayerIds: votePhase.proposedTeam,
      cards: [],
    };
  } else {
    ts.consecutiveRejections++;

    if (ts.consecutiveRejections >= CONSECUTIVE_REJECTION_LIMIT) {
      game.status = {
        type: GameStatus.Finished,
        winner: "Bad",
        victoryConditionKey: "consecutive-rejections",
      };
      return;
    }

    // Rotate to next leader
    const nextLeaderIndex = (ts.currentLeaderIndex + 1) % ts.leaderOrder.length;
    ts.currentLeaderIndex = nextLeaderIndex;
    // leaderOrder is guaranteed non-empty (validated at game init)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const nextLeaderId = ts.leaderOrder[nextLeaderIndex]!;
    const teamSize = ts.questTeamSizes[ts.questNumber - 1] ?? 2;

    ts.phase = {
      type: AvalonPhase.TeamProposal,
      leaderId: nextLeaderId,
      teamSize,
    };
  }
}

/**
 * Tally the team vote and mark it resolved. Any player can trigger this once
 * all players have voted or when the UI determines it's time to resolve.
 */
export const resolveTeamVoteAction: GameAction = {
  isValid(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== AvalonPhase.TeamVote) return false;
    return ts.phase.passed === undefined;
  },

  apply(game: Game) {
    tallyTeamVote(game);
  },
};

/**
 * Advance from team vote results to the next phase.
 * Any player can call this once the team vote has been tallied.
 */
export const advanceFromTeamVoteAction: GameAction = {
  isValid(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== AvalonPhase.TeamVote) return false;
    return ts.phase.passed !== undefined;
  },

  apply(game: Game) {
    advanceFromTeamVote(game);
  },
};
