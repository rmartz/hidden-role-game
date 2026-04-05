import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { SecretVillainPhase, PolicyCard } from "../types";
import {
  currentTurnState,
  getNextPresidentId,
  getSpecialAction,
  checkBoardWinCondition,
} from "../utils";

export const chancellorPlayAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.PolicyChancellor) return false;
    if (ts.phase.chancellorId !== callerId) return false;
    if (ts.phase.playedCard !== undefined) return false;

    const { cardIndex } = payload as { cardIndex?: unknown };
    if (typeof cardIndex !== "number") return false;
    return cardIndex >= 0 && cardIndex < 2;
  },

  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.PolicyChancellor) return;
    if (ts.phase.chancellorId !== callerId) return;

    const { cardIndex } = payload as { cardIndex: number };
    const remainingCards = [...ts.phase.remainingCards];
    const [played] = remainingCards.splice(cardIndex, 1);
    const [discarded] = remainingCards;
    if (!played || !discarded) return;

    ts.discardPile = [...ts.discardPile, discarded];

    // Update board.
    if (played === PolicyCard.Good) {
      ts.goodCardsPlayed++;
    } else {
      ts.badCardsPlayed++;
    }

    // Update previous administration.
    ts.previousPresidentId = ts.phase.presidentId;
    ts.previousChancellorId = ts.phase.chancellorId;

    // Check win condition.
    const boardWin = checkBoardWinCondition(ts);
    if (boardWin) {
      game.status = { type: GameStatus.Finished, winner: boardWin.winner };
      return;
    }

    // Check for special action trigger (only on Bad cards).
    if (played === PolicyCard.Bad) {
      const action = getSpecialAction(ts.badCardsPlayed, ts.boardPreset);
      if (action) {
        ts.phase = {
          type: SecretVillainPhase.SpecialAction,
          startedAt: Date.now(),
          presidentId: ts.phase.presidentId,
          actionType: action,
        };
        return;
      }
    }

    // No special action — advance to next election.
    const { presidentId, nextIndex } = getNextPresidentId(ts);
    ts.currentPresidentIndex = nextIndex;
    ts.phase = {
      type: SecretVillainPhase.ElectionNomination,
      startedAt: Date.now(),
      presidentId,
    };
    ts.turn++;
  },
};
