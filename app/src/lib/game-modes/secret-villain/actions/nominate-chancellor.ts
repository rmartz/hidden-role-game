import type { Game, GameAction } from "@/lib/types";
import { SecretVillainPhase } from "../types";
import { currentTurnState, getEligibleChancellorIds } from "../utils";

export const nominateChancellorAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.ElectionNomination) return false;
    if (ts.phase.presidentId !== callerId) return false;

    const { chancellorId } = payload as { chancellorId?: unknown };
    if (typeof chancellorId !== "string") return false;

    const eligible = getEligibleChancellorIds(ts, callerId);
    return eligible.includes(chancellorId);
  },

  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.ElectionNomination) return;

    const { chancellorId } = payload as { chancellorId: string };

    ts.phase = {
      type: SecretVillainPhase.ElectionVote,
      startedAt: Date.now(),
      presidentId: callerId,
      chancellorNomineeId: chancellorId,
      votes: [],
    };
  },
};
