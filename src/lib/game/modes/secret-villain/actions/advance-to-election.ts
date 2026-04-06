import type { Game } from "@/lib/types";
import { SecretVillainPhase } from "../types";
import { currentTurnState, getNextPresidentId } from "../utils";

/**
 * Advances the game from a SpecialAction phase to the next ElectionNomination.
 * Shared by all special action resolution actions.
 */
export function advanceToNextElection(game: Game): void {
  const ts = currentTurnState(game);
  if (!ts) return;

  const { presidentId, nextIndex } = getNextPresidentId(ts);
  ts.currentPresidentIndex = nextIndex;
  ts.specialPresidentId = undefined;

  ts.phase = {
    type: SecretVillainPhase.ElectionNomination,
    startedAt: Date.now(),
    presidentId,
  };
  ts.turn++;
}
