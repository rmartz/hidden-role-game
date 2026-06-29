import type { PlayerRoleAssignment } from "@/lib/types";

import { getWerewolfRole, WerewolfRole } from "../roles";
import type { AnyNightAction } from "../types";
import { isTeamNightAction, TargetCategory } from "../types";
import { baseGroupPhaseKey } from "./phase-keys";
import { computeSuggestedTarget } from "./targeting";

/**
 * Applies Tavern Keeper retroactive undo to the current night's actions.
 * For solo phases, the target phase is removed. For group phases, only the
 * target player's votes are removed and suggested targets are recomputed.
 * Returns the transformed actions and the hangover target when undo applies.
 */
export function applyTavernKeeperUndo(
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
): {
  resolvedNightActions: Record<string, AnyNightAction>;
  hangoverTargetPlayerId?: string;
} {
  let resolvedNightActions = nightActions;
  const tkAction = nightActions[WerewolfRole.TavernKeeper];

  if (
    !tkAction ||
    isTeamNightAction(tkAction) ||
    !tkAction.confirmed ||
    !tkAction.targetPlayerId
  ) {
    return { resolvedNightActions };
  }

  const tkTarget = tkAction.targetPlayerId;
  const targetAssignment = roleAssignments.find((a) => a.playerId === tkTarget);
  const targetRole = targetAssignment
    ? getWerewolfRole(targetAssignment.roleDefinitionId)
    : undefined;

  if (!targetRole || targetRole.targetCategory === TargetCategory.Investigate) {
    return { resolvedNightActions };
  }

  const targetUsesGroupPhase =
    targetRole.teamTargeting ?? targetRole.wakesWith !== undefined;

  if (!targetUsesGroupPhase) {
    const blockedPhaseKey = targetRole.id as string;
    resolvedNightActions = Object.fromEntries(
      Object.entries(nightActions).filter(
        ([k]) => baseGroupPhaseKey(k) !== blockedPhaseKey,
      ),
    );
  } else {
    const blockedGroupPhaseKey = (targetRole.wakesWith ??
      targetRole.id) as string;
    resolvedNightActions = Object.fromEntries(
      Object.entries(resolvedNightActions).map(([phaseKey, action]) => {
        if (baseGroupPhaseKey(phaseKey) !== blockedGroupPhaseKey) {
          return [phaseKey, action];
        }
        if (!isTeamNightAction(action)) {
          return [phaseKey, action];
        }

        const votes = action.votes.filter((vote) => vote.playerId !== tkTarget);
        const suggestedTargetId = computeSuggestedTarget(votes);
        const nextAction = { ...action, votes, suggestedTargetId };
        return [phaseKey, nextAction];
      }),
    );
  }

  return { resolvedNightActions, hangoverTargetPlayerId: tkTarget };
}
