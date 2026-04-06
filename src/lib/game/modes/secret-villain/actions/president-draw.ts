import type { Game, GameAction } from "@/lib/types";
import { SecretVillainPhase } from "../types";
import { currentTurnState } from "../utils";

/** President draws their 3 policy cards (reveals them to themselves). */
export const presidentDrawAction: GameAction = {
  isValid(game: Game, callerId: string) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.PolicyPresident) return false;
    if (ts.phase.presidentId !== callerId) return false;
    return ts.phase.cardsRevealed !== true;
  },

  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.PolicyPresident) return;
    ts.phase.cardsRevealed = true;
  },
};
