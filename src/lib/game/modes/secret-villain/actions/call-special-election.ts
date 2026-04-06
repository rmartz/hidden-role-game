import type { Game, GameAction } from "@/lib/types";
import { SecretVillainPhase, SpecialActionType } from "../types";
import { currentTurnState } from "../utils";

/**
 * President selects a player to become the next president via special
 * election. Sets specialPresidentId and advances to the next election.
 */
export const callSpecialElectionAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.SpecialAction) return false;
    if (ts.phase.actionType !== SpecialActionType.SpecialElection) return false;
    if (ts.phase.presidentId !== callerId) return false;
    if (ts.phase.resolved) return false;

    const { targetPlayerId } = payload as { targetPlayerId?: unknown };
    if (typeof targetPlayerId !== "string") return false;
    if (targetPlayerId === callerId) return false;
    if (ts.eliminatedPlayerIds.includes(targetPlayerId)) return false;
    return game.players.some((p) => p.id === targetPlayerId);
  },

  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.SpecialAction) return;

    const { targetPlayerId } = payload as { targetPlayerId: string };

    // Set the special president — getNextPresidentId will return this player
    // for the next election, then rotation resumes normally.
    ts.specialPresidentId = targetPlayerId;

    ts.phase = {
      type: SecretVillainPhase.ElectionNomination,
      startedAt: Date.now(),
      presidentId: targetPlayerId,
    };
    ts.turn++;
  },
};
