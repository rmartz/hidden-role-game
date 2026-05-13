import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { SecretVillainPhase, PolicyCard } from "../types";
import { currentTurnState, drawCards, reshuffleIfNeeded } from "../utils";
import {
  SecretVillainWinner,
  SvVictoryConditionKey,
} from "../utils/win-condition";

/** Chancellor denies being the Special Bad — sets revealed = false. */
export const confirmSpecialBadAction: GameAction = {
  isValid(game: Game, callerId: string) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.SpecialBadReveal) return false;
    return (
      ts.phase.chancellorId === callerId && ts.phase.revealed === undefined
    );
  },

  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    if (ts.phase.type !== SecretVillainPhase.SpecialBadReveal) return;
    ts.phase.revealed = false;
  },
};

/** Chancellor reveals themselves as the Special Bad — sets revealed = true. */
export const revealSpecialBadAction: GameAction = {
  isValid(game: Game, callerId: string) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.SpecialBadReveal) return false;
    return (
      ts.phase.chancellorId === callerId && ts.phase.revealed === undefined
    );
  },

  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    if (ts.phase.type !== SecretVillainPhase.SpecialBadReveal) return;
    ts.phase.revealed = true;
  },
};

/**
 * Advance out of SpecialBadReveal after the chancellor has acted.
 * revealed = true  → Bad team wins.
 * revealed = false → policy phase (president draws).
 */
export const advanceFromSpecialBadRevealAction: GameAction = {
  isValid(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.SpecialBadReveal) return false;
    return ts.phase.revealed !== undefined;
  },

  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    if (ts.phase.type !== SecretVillainPhase.SpecialBadReveal) return;

    if (ts.phase.revealed === true) {
      game.status = {
        type: GameStatus.Finished,
        winner: SecretVillainWinner.Bad,
        victoryConditionKey: SvVictoryConditionKey.SpecialBadElected,
      };
      return;
    }

    const reshuffled = reshuffleIfNeeded(ts.deck, ts.discardPile);
    const { drawn, remaining } = drawCards(reshuffled.deck, 3);
    ts.deck = remaining;
    ts.discardPile = reshuffled.discardPile;

    const { presidentId, chancellorId } = ts.phase;
    ts.specialPresidentId = undefined;
    ts.phase = {
      type: SecretVillainPhase.PolicyPresident,
      startedAt: Date.now(),
      presidentId,
      chancellorId,
      drawnCards: drawn as [PolicyCard, PolicyCard, PolicyCard],
    };
  },
};
