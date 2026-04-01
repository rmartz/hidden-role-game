import type { Game, GameAction } from "@/lib/types";
import { SecretVillainPhase, SpecialActionType, PolicyCard } from "../types";
import { currentTurnState } from "../utils";
import { advanceToNextElection } from "./advance-to-election";

/**
 * The president secretly looks at the top 3 cards of the policy deck.
 * This action both reveals the cards and is immediately resolvable —
 * the president acknowledges and the game advances.
 */
export const policyPeekAction: GameAction = {
  isValid(game: Game, callerId: string) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.SpecialAction) return false;
    if (ts.phase.actionType !== SpecialActionType.PolicyPeek) return false;
    if (ts.phase.presidentId !== callerId) return false;
    // Can only peek once (peekedCards is set on first call).
    return ts.phase.peekedCards === undefined;
  },

  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.SpecialAction) return;

    // Reveal the top 3 cards without removing them from the deck.
    ts.phase.peekedCards = ts.deck.slice(0, 3) as [
      PolicyCard,
      PolicyCard,
      PolicyCard,
    ];
  },
};

/**
 * President acknowledges the peek and the game advances to the next
 * election.
 */
export const resolvePolicyPeekAction: GameAction = {
  isValid(game: Game, callerId: string) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.SpecialAction) return false;
    if (ts.phase.actionType !== SpecialActionType.PolicyPeek) return false;
    if (ts.phase.presidentId !== callerId) return false;
    return ts.phase.peekedCards !== undefined;
  },

  apply(game: Game) {
    advanceToNextElection(game);
  },
};
