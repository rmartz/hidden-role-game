import type { Game, GameAction } from "@/lib/types";
import { SecretVillainPhase, VETO_UNLOCK_THRESHOLD } from "../types";
import { currentTurnState, getNextPresidentId } from "../utils";

/**
 * Chancellor proposes vetoing both policy cards. Only available when
 * veto power is unlocked (4+ Bad cards played).
 */
export const proposeVetoAction: GameAction = {
  isValid(game: Game, callerId: string) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.PolicyChancellor) return false;
    if (ts.phase.chancellorId !== callerId) return false;
    if (ts.phase.playedCard !== undefined) return false;
    if (ts.phase.vetoProposed) return false;
    return ts.badCardsPlayed >= VETO_UNLOCK_THRESHOLD;
  },

  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.PolicyChancellor) return;

    ts.phase.vetoProposed = true;
  },
};

/**
 * President responds to the chancellor's veto proposal.
 * Accept (consent=true): both cards discarded, failed election count
 * increments, previous administration is set, next election begins.
 * Reject (consent=false): chancellor must play a card normally.
 */
export const respondVetoAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.PolicyChancellor) return false;
    if (ts.phase.presidentId !== callerId) return false;
    if (!ts.phase.vetoProposed) return false;
    if (ts.phase.vetoResponse !== undefined) return false;

    const { consent } = payload as { consent?: unknown };
    return typeof consent === "boolean";
  },

  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.PolicyChancellor) return;

    const { consent } = payload as { consent: boolean };
    ts.phase.vetoResponse = consent;

    if (consent) {
      // Veto accepted: discard both cards.
      ts.discardPile = [...ts.discardPile, ...ts.phase.remainingCards];
      ts.failedElectionCount++;

      // The vetoing president and chancellor are the previous administration.
      ts.previousPresidentId = ts.phase.presidentId;
      ts.previousChancellorId = ts.phase.chancellorId;

      // Advance to next election.
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
    // If rejected, chancellor must play normally — no phase transition.
  },
};
