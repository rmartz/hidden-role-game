import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import {
  SecretVillainPhase,
  FAILED_ELECTION_THRESHOLD,
  BAD_CARDS_FOR_SPECIAL_BAD_WIN,
  CARDS_TO_WIN,
  PolicyCard,
} from "../types";
import {
  currentTurnState,
  getNextPresidentId,
  drawCards,
  reshuffleIfNeeded,
} from "../utils";
import { SecretVillainRole } from "../roles";

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
      if (ts.badCardsPlayed >= BAD_CARDS_FOR_SPECIAL_BAD_WIN) {
        const chancellorRole = game.roleAssignments.find(
          (a) => a.playerId === votePhase.chancellorNomineeId,
        );
        if (
          chancellorRole?.roleDefinitionId ===
          (SecretVillainRole.SpecialBad as string)
        ) {
          game.status = { type: GameStatus.Finished, winner: "Bad" };
          return;
        }
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
        if (ts.goodCardsPlayed >= CARDS_TO_WIN) {
          game.status = { type: GameStatus.Finished, winner: "Good" };
          return;
        }
        if (ts.badCardsPlayed >= CARDS_TO_WIN) {
          game.status = { type: GameStatus.Finished, winner: "Bad" };
          return;
        }
      }

      // Advance to next president.
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
