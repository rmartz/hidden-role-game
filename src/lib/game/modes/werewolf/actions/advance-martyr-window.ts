import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import {
  currentTurnState,
  isOwnerPlaying,
  checkWinCondition,
  WerewolfWinner,
} from "../utils";
import { WerewolfRole } from "../roles";
import { didWolfCubDie, cleanupAfterDaytimeKill } from "./helpers";

/**
 * Advances past the post-trial Martyr window, applying the pending guilty
 * verdict to the convicted player. This action is available to the narrator
 * whenever a Guilty verdict is pending (pendingGuiltId is set).
 *
 * The Martyr window is always inserted after a Guilty verdict — even when
 * no Martyr is in the game — to build drama before the role reveal.
 */
export const advanceMartyrWindowAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    return ts.phase.pendingGuiltId !== undefined;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const { pendingGuiltId } = ts.phase;
    if (!pendingGuiltId) return;

    const defendantId = pendingGuiltId;
    ts.phase.pendingGuiltId = undefined;

    if (!ts.deadPlayerIds.includes(defendantId)) {
      ts.deadPlayerIds = [...ts.deadPlayerIds, defendantId];
      if (didWolfCubDie([defendantId], game)) {
        ts.wolfCubDied = true;
      }
      cleanupAfterDaytimeKill(defendantId, ts);
    }

    // Executioner wins if their target was eliminated and the Executioner is alive.
    // Check Executioner before Tanner (if target is also the Tanner, Executioner wins).
    if (ts.executionerTargetId === defendantId) {
      const executionerAssignment = game.roleAssignments.find(
        (a) => a.roleDefinitionId === (WerewolfRole.Executioner as string),
      );
      const executionerAlive =
        executionerAssignment !== undefined &&
        !ts.deadPlayerIds.includes(executionerAssignment.playerId);
      if (executionerAlive) {
        game.status = {
          type: GameStatus.Finished,
          winner: WerewolfWinner.Executioner,
        };
        return;
      }
    }

    // Tanner wins if eliminated at trial.
    const tannerAssignment = game.roleAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.Tanner as string),
    );
    if (tannerAssignment?.playerId === defendantId) {
      game.status = {
        type: GameStatus.Finished,
        winner: WerewolfWinner.Tanner,
      };
      return;
    }

    // Hunter revenge: if the eliminated player is the Hunter, defer win check.
    const eliminatedRole = game.roleAssignments.find(
      (a) => a.playerId === defendantId,
    )?.roleDefinitionId;
    if (eliminatedRole === (WerewolfRole.Hunter as string)) {
      ts.hunterRevengePlayerId = defendantId;
      return;
    }

    const winResult = checkWinCondition(game, ts.deadPlayerIds);
    if (winResult) {
      game.status = winResult;
    }
  },
};
