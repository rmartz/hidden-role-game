import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { ClocktowerPhase } from "../types";
import type { ClocktowerTurnState } from "../types";
import { ClocktowerRole, isClocktowerRole } from "../roles";

function currentTurnState(game: Game): ClocktowerTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as ClocktowerTurnState | undefined;
}

/**
 * Resolves which role ID the caller is acting for.
 * The Storyteller may pass an explicit `roleId`; players use their own assignment.
 */
function resolveActingRoleId(
  game: Game,
  callerId: string,
  roleId: string | undefined,
): string | undefined {
  if (callerId === game.ownerPlayerId) {
    if (typeof roleId !== "string") return undefined;
    if (!isClocktowerRole(roleId)) return undefined;
    if (
      !game.roleAssignments.some(
        (a) => a.roleDefinitionId === (roleId as string),
      )
    )
      return undefined;
    return roleId;
  }
  return game.roleAssignments.find((a) => a.playerId === callerId)
    ?.roleDefinitionId;
}

/**
 * Player confirms their night target selection, locking it in.
 *
 * For the Fortune Teller, both `targetPlayerId` and `secondTargetPlayerId`
 * must be set before confirming.
 *
 * Payload:
 *   - roleId?: string — Storyteller only: which role's action to confirm
 */
export const confirmNightTargetAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== ClocktowerPhase.Night) return false;

    const { roleId } = payload as { roleId?: unknown };

    const activeRoleId = resolveActingRoleId(
      game,
      callerId,
      typeof roleId === "string" ? roleId : undefined,
    );
    if (!activeRoleId) return false;

    const action = ts.phase.nightActions[activeRoleId];
    // Must have a night action entry for this role
    if (!action) return false;
    // Cannot confirm twice
    if (action.confirmed) return false;
    // Must have a target
    if (!action.targetPlayerId) return false;

    // Fortune Teller requires both targets
    if (
      isClocktowerRole(activeRoleId) &&
      activeRoleId === ClocktowerRole.FortuneTeller
    ) {
      if (!action.secondTargetPlayerId) return false;
    }

    return true;
  },

  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (!ts) return;
    if (ts.phase.type !== ClocktowerPhase.Night) return;

    const { roleId } = payload as { roleId?: string };

    const activeRoleId = resolveActingRoleId(game, callerId, roleId);
    if (!activeRoleId) return;

    const phase = ts.phase;
    const action = phase.nightActions[activeRoleId];
    if (!action) return;

    phase.nightActions[activeRoleId] = { ...action, confirmed: true };
  },
};
