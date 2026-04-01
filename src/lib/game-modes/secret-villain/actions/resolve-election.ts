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

export const resolveElectionAction: GameAction = {
  isValid(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.ElectionVote) return false;
    if (ts.phase.passed !== undefined) return false;

    // All alive (non-eliminated) players must have voted.
    const alivePlayerIds = game.players
      .map((p) => p.id)
      .filter((id) => !ts.eliminatedPlayerIds.includes(id));
    return ts.phase.votes.length >= alivePlayerIds.length;
  },

  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.ElectionVote) return;

    const votePhase = ts.phase;
    const ayes = votePhase.votes.filter((v) => v.vote === "aye").length;
    const nos = votePhase.votes.filter((v) => v.vote === "no").length;
    const passed = ayes > nos;

    votePhase.passed = passed;

    if (passed) {
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

      // Reshuffle if needed before drawing.
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

      // Clear special president after use.
      ts.specialPresidentId = undefined;
    } else {
      // Failed election.
      ts.failedElectionCount++;

      if (ts.failedElectionCount >= FAILED_ELECTION_THRESHOLD) {
        // Auto-play: draw top card from deck.
        const reshuffled = reshuffleIfNeeded(ts.deck, ts.discardPile);
        const { drawn, remaining } = drawCards(reshuffled.deck, 1);
        ts.deck = remaining;
        ts.discardPile = reshuffled.discardPile;
        ts.failedElectionCount = 0;

        // Previous administration is cleared on chaos.
        ts.previousPresidentId = undefined;
        ts.previousChancellorId = undefined;

        const [card] = drawn;
        if (card === PolicyCard.Good) {
          ts.goodCardsPlayed++;
        } else {
          ts.badCardsPlayed++;
        }

        // Check win after auto-play.
        const boardWin = checkBoardWinCondition(ts);
        if (boardWin) {
          game.status = {
            type: GameStatus.Finished,
            winner: boardWin.winner,
          };
          return;
        }
      }

      // Advance to next president. Clear special president — whether they
      // just served (failed) or were skipped by chaos, the override is consumed.
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
  },
};
