import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";

import { WerewolfRole } from "../roles";
import { WerewolfPhase } from "../types";
import {
  checkWinCondition,
  currentTurnState,
  isOwnerPlaying,
  WerewolfWinner,
  withMercenaryCoWin,
} from "../utils";
import { cleanupAfterDaytimeKill, didWolfCubDie } from "./helpers";

/**
 * Allows the Martyr to intercept a Guilty verdict, dying in place of the
 * convicted player. The convicted player survives; the Martyr is eliminated.
 *
 * Valid only when:
 * - A Guilty verdict is pending (pendingGuiltId is set).
 * - The caller is the Martyr (or the narrator acting on their behalf).
 * - The Martyr is alive and has not previously used this ability.
 * - The Martyr is not the convicted player (cannot save themselves).
 *
 * The narrator (owner) may call this action on behalf of any Martyr player,
 * bypassing the caller-identity check.
 */
export const useMartyrAbilityAction: GameAction = {
  isValid(game: Game, callerId: string) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    if (!ts.phase.pendingGuiltId) return false;
    const martyrState = ts.roleState?.martyr;
    if (martyrState?.abilityUsed) return false;
    const isOwner = isOwnerPlaying(game, callerId);
    // Find the Martyr assignment — needed for both owner and player callers.
    const martyrAssignment = game.roleAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.Martyr as string),
    );
    if (!martyrAssignment) return false;
    const martyrId = martyrAssignment.playerId;
    // Non-owner callers must be the Martyr themselves.
    if (!isOwner && callerId !== martyrId) return false;
    // Martyr must be alive
    if (ts.deadPlayerIds.includes(martyrId)) return false;
    // Martyr cannot save themselves
    if (ts.phase.pendingGuiltId === martyrId) return false;
    return true;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    if (!ts.phase.pendingGuiltId) return;

    // Resolve the Martyr player ID — always from roleAssignments since Martyr is unique.
    const martyrAssignment = game.roleAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.Martyr as string),
    );
    if (!martyrAssignment) return;
    const martyrId = martyrAssignment.playerId;

    // Convicted player is spared; Martyr dies instead.
    ts.phase.pendingGuiltId = undefined;
    ts.roleState = {
      ...(ts.roleState ?? {}),
      martyr: { abilityUsed: true },
    };

    if (!ts.deadPlayerIds.includes(martyrId)) {
      ts.deadPlayerIds = [...ts.deadPlayerIds, martyrId];
      if (didWolfCubDie([martyrId], game)) {
        ts.roleState = { ...(ts.roleState ?? {}), wolfCub: { died: true } };
      }
      cleanupAfterDaytimeKill(martyrId, ts, game);
    }

    // Executioner wins if their target was the Martyr (who voluntarily died).
    if (ts.roleState.executioner?.targetId === martyrId) {
      const executionerAssignment = game.roleAssignments.find(
        (a) => a.roleDefinitionId === (WerewolfRole.Executioner as string),
      );
      const executionerAlive =
        executionerAssignment !== undefined &&
        !ts.deadPlayerIds.includes(executionerAssignment.playerId);
      if (executionerAlive) {
        game.status = withMercenaryCoWin(
          { type: GameStatus.Finished, winner: WerewolfWinner.Executioner },
          game,
          ts.deadPlayerIds,
        );
        return;
      }
    }

    const winResult = checkWinCondition(game, ts.deadPlayerIds);
    if (winResult) {
      game.status = winResult;
    }
  },
};
