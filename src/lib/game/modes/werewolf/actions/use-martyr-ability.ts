import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, checkWinCondition } from "../utils";
import { WerewolfRole } from "../roles";
import { didWolfCubDie, cleanupAfterDaytimeKill } from "./helpers";

/**
 * Allows the Martyr to intercept a Guilty verdict, dying in place of the
 * convicted player. The convicted player survives; the Martyr is eliminated.
 *
 * Valid only when:
 * - A Guilty verdict is pending (pendingGuiltId is set).
 * - The caller is the Martyr.
 * - The Martyr is alive and has not previously used this ability.
 * - The Martyr is not the convicted player (cannot save themselves).
 */
export const useMartyrAbilityAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (callerId === game.ownerPlayerId) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    if (!ts.phase.pendingGuiltId) return false;
    if (ts.martyrUsed) return false;
    // Caller must be the Martyr
    const martyrAssignment = game.roleAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.Martyr as string),
    );
    if (!martyrAssignment || martyrAssignment.playerId !== callerId)
      return false;
    // Martyr must be alive
    if (ts.deadPlayerIds.includes(callerId)) return false;
    // Martyr cannot save themselves
    if (ts.phase.pendingGuiltId === callerId) return false;
    return true;
  },
  apply(game: Game, _payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    if (!ts.phase.pendingGuiltId) return;

    // Convicted player is spared; Martyr dies instead.
    ts.phase.pendingGuiltId = undefined;
    ts.martyrUsed = true;

    const martyrId = callerId;
    if (!ts.deadPlayerIds.includes(martyrId)) {
      ts.deadPlayerIds = [...ts.deadPlayerIds, martyrId];
      if (didWolfCubDie([martyrId], game)) {
        ts.wolfCubDied = true;
      }
      cleanupAfterDaytimeKill(martyrId, ts);
    }

    const winResult = checkWinCondition(game, ts.deadPlayerIds);
    if (winResult) {
      game.status = winResult;
    }
  },
};
