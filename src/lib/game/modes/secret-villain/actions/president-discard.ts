import type { Game, GameAction } from "@/lib/types";
import { SecretVillainPhase, PolicyCard } from "../types";
import { currentTurnState } from "../utils";

export const presidentDiscardAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.PolicyPresident) return false;
    if (ts.phase.presidentId !== callerId) return false;
    if (ts.phase.discardedCard !== undefined) return false;

    const { cardIndex } = payload as { cardIndex?: unknown };
    if (typeof cardIndex !== "number") return false;
    return cardIndex >= 0 && cardIndex < 3;
  },

  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.PolicyPresident) return;
    if (ts.phase.presidentId !== callerId) return;

    const { cardIndex } = payload as { cardIndex: number };
    const drawnCards = [...ts.phase.drawnCards];
    const [discarded] = drawnCards.splice(cardIndex, 1);
    if (!discarded) return;

    ts.discardPile = [...ts.discardPile, discarded];
    ts.phase = {
      type: SecretVillainPhase.PolicyChancellor,
      startedAt: Date.now(),
      presidentId: ts.phase.presidentId,
      chancellorId: ts.phase.chancellorId,
      remainingCards: drawnCards as [PolicyCard, PolicyCard],
    };
  },
};
