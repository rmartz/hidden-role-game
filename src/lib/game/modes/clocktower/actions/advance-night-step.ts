import type { Game, GameAction } from "@/lib/types";
import { getNightContext } from "./helpers";

/**
 * `advance-night-step`
 *
 * Storyteller-only action. Advances `currentActionIndex` by one, moving to
 * the next role's step in the night action order.
 *
 * Payload: none (empty object `{}`)
 */
export const advanceNightStepAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (callerId !== game.ownerPlayerId) return false;
    return getNightContext(game) !== undefined;
  },

  apply(game: Game) {
    const ctx = getNightContext(game);
    if (!ctx) return;
    ctx.phase.currentActionIndex += 1;
  },
};
