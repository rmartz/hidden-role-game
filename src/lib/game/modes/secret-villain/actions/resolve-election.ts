import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import {
  SecretVillainPhase,
  FAILED_ELECTION_THRESHOLD,
  PolicyCard,
} from "../types";
import {
  currentTurnState,
  getNextPresidentId,
  drawCards,
  reshuffleIfNeeded,
  checkBoardWinCondition,
  checkChancellorElectionWinCondition,
} from "../utils";

/**
 * Tally the election votes and set `passed` on the phase.
 * Does NOT transition to the next phase — call advanceFromElection for that.
 */
export function tallyElection(game: Game): void {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== SecretVillainPhase.ElectionVote) return;
  if (ts.phase.passed !== undefined) return;

  const ayes = ts.phase.votes.filter((v) => v.vote === "yes").length;
  const nos = ts.phase.votes.filter((v) => v.vote === "no").length;
  ts.phase.passed = ayes > nos;
}

/**
 * Advance from a resolved election to the next phase.
 * Must be called after tallyElection has set `passed`.
 */
export function advanceFromElection(game: Game): void {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== SecretVillainPhase.ElectionVote) return;

  const votePhase = ts.phase;
  if (votePhase.passed === undefined) return;

  if (votePhase.passed) {
    // Check Special Bad chancellor win condition.
    const chancellorWin = checkChancellorElectionWinCondition(
      votePhase.chancellorNomineeId,
      game.roleAssignments,
      ts.badCardsPlayed,
    );
    if (chancellorWin) {
      game.status = {
        type: GameStatus.Finished,
        winner: chancellorWin.winner,
      };
      return;
    }

    // Successful election → transition to policy phase.
    ts.failedElectionCount = 0;

    const reshuffled = reshuffleIfNeeded(ts.deck, ts.discardPile);
    const { drawn, remaining } = drawCards(reshuffled.deck, 3);
    ts.deck = remaining;
    ts.discardPile = reshuffled.discardPile;

    ts.phase = {
      type: SecretVillainPhase.PolicyPresident,
      startedAt: Date.now(),
      presidentId: votePhase.presidentId,
      chancellorId: votePhase.chancellorNomineeId,
      drawnCards: drawn as [PolicyCard, PolicyCard, PolicyCard],
    };

    ts.specialPresidentId = undefined;
  } else {
    // Failed election.
    ts.failedElectionCount++;

    if (ts.failedElectionCount >= FAILED_ELECTION_THRESHOLD) {
      const reshuffled = reshuffleIfNeeded(ts.deck, ts.discardPile);
      const { drawn, remaining } = drawCards(reshuffled.deck, 1);
      ts.deck = remaining;
      ts.discardPile = reshuffled.discardPile;
      ts.failedElectionCount = 0;

      ts.previousPresidentId = undefined;
      ts.previousChancellorId = undefined;

      const [card] = drawn;
      if (card === PolicyCard.Good) {
        ts.goodCardsPlayed++;
      } else {
        ts.badCardsPlayed++;
      }

      const boardWin = checkBoardWinCondition(ts);
      if (boardWin) {
        game.status = {
          type: GameStatus.Finished,
          winner: boardWin.winner,
        };
        return;
      }
    }

    ts.specialPresidentId = undefined;
    const { presidentId, nextIndex } = getNextPresidentId(ts);
    ts.currentPresidentIndex = nextIndex;

    ts.phase = {
      type: SecretVillainPhase.ElectionNomination,
      startedAt: Date.now(),
      presidentId,
    };

    ts.turn++;
  }
}

/**
 * Tally the election and mark it resolved. Can be called when all players
 * have voted or when the timer has expired (abstentions count as "no").
 * Any player can trigger this — the UI gates when the button appears.
 */
export const resolveElectionAction: GameAction = {
  isValid(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.ElectionVote) return false;
    // Already tallied — use advanceFromElection instead.
    return ts.phase.passed === undefined;
  },

  apply(game: Game) {
    tallyElection(game);
  },
};

/**
 * Advance from election results to the next phase.
 * Any player can call this once the election has been tallied.
 */
export const advanceFromElectionAction: GameAction = {
  isValid(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.ElectionVote) return false;
    return ts.phase.passed !== undefined;
  },

  apply(game: Game) {
    advanceFromElection(game);
  },
};
