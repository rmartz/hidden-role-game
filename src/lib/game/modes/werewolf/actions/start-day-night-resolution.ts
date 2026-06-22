import type { PlayerRoleAssignment } from "@/lib/types";

import { getWerewolfRole, WerewolfRole } from "../roles";
import type {
  AnyNightAction,
  AttackNightResolutionEvent,
  NightResolutionEvent,
  WerewolfRoleTurnState,
} from "../types";
import { isTeamNightAction } from "../types";

/**
 * Returns the Old Man's player ID if the Old Man timer fires this turn
 * (i.e. the turn is >= #werewolves + 2 and the Old Man is still alive).
 */
export function computeOldManTimerPlayerId(
  effectiveAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
  turn: number,
): string | undefined {
  const werewolfCount = effectiveAssignments.filter((a) => {
    const roleDef = getWerewolfRole(a.roleDefinitionId);
    return roleDef?.isWerewolf === true;
  }).length;
  const oldManAssignment = effectiveAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.OldMan as string),
  );
  return oldManAssignment &&
    !deadPlayerIds.includes(oldManAssignment.playerId) &&
    turn >= werewolfCount + 2
    ? oldManAssignment.playerId
    : undefined;
}

/**
 * Computes the updated Monarch knighting state for the start of a new day.
 */
export function computeMonarchKnightingState(
  nightActions: Record<string, AnyNightAction>,
  rs: WerewolfRoleTurnState,
): {
  monarchKnightedPlayerIds: string[];
  monarchKnightingsUsed: number;
  knightedPlayerId: string | undefined;
} {
  const monarchAction = nightActions[WerewolfRole.Monarch as string];
  const targetKnightedTonight =
    monarchAction &&
    !isTeamNightAction(monarchAction) &&
    monarchAction.targetPlayerId !== undefined
      ? monarchAction.targetPlayerId
      : undefined;
  const previousKnightingsUsed = rs.monarch?.knightingsUsed ?? 0;
  const previousKnightedIds = rs.monarch?.knightedPlayerIds ?? [];
  const monarchCanKnight =
    targetKnightedTonight !== undefined &&
    previousKnightingsUsed < 3 &&
    !previousKnightedIds.includes(targetKnightedTonight);
  return {
    monarchKnightedPlayerIds: monarchCanKnight
      ? [...new Set([...previousKnightedIds, targetKnightedTonight])]
      : previousKnightedIds,
    monarchKnightingsUsed: monarchCanKnight
      ? previousKnightingsUsed + 1
      : previousKnightingsUsed,
    knightedPlayerId: monarchCanKnight ? targetKnightedTonight : undefined,
  };
}

/**
 * Computes the updated priest wards record after a night.
 * Consumes (removes) wards for players who were attacked this night.
 */
export function computePriestWards(
  nightResolution: NightResolutionEvent[],
  priestWardsForResolution: Record<string, string>,
): Record<string, string> {
  const attackedPlayerIds = new Set(
    nightResolution
      .filter((e): e is AttackNightResolutionEvent => e.type === "killed")
      .map((e) => e.targetPlayerId),
  );
  const priestWards: Record<string, string> = {};
  for (const [wardedId, priestId] of Object.entries(priestWardsForResolution)) {
    if (!attackedPlayerIds.has(wardedId)) {
      priestWards[wardedId] = priestId;
    }
  }
  return priestWards;
}

/**
 * Computes the new One-Eyed Seer locked target ID after a night.
 * Sets a lock if the OES investigated a werewolf; clears the lock if the target died.
 */
export function computeOesLockedTargetId(
  nightActions: Record<string, AnyNightAction>,
  effectiveAssignments: PlayerRoleAssignment[],
  newDeadIds: string[],
  existingLockedId: string | undefined,
): string | undefined {
  let lockedId = existingLockedId;
  const oesAction = nightActions[WerewolfRole.OneEyedSeer as string];
  if (
    oesAction &&
    !isTeamNightAction(oesAction) &&
    oesAction.confirmed &&
    oesAction.targetPlayerId
  ) {
    const targetAssignment = effectiveAssignments.find(
      (a) => a.playerId === oesAction.targetPlayerId,
    );
    const targetRoleDef = targetAssignment
      ? getWerewolfRole(targetAssignment.roleDefinitionId)
      : undefined;
    if (targetRoleDef?.isWerewolf) {
      lockedId = oesAction.targetPlayerId;
    }
  }
  if (lockedId && newDeadIds.includes(lockedId)) {
    return undefined;
  }
  return lockedId;
}

/**
 * Computes the Exposer reveal for this night.
 * Returns the new reveal (for the daytime exposerReveal field) and the
 * cumulative exposerReveal to carry into roleState.
 */
export function computeExposerReveal(
  nightActions: Record<string, AnyNightAction>,
  effectiveAssignments: PlayerRoleAssignment[],
  existingReveal: { playerId: string; roleId: string } | undefined,
): {
  newExposerReveal: { playerId: string; roleId: string } | undefined;
  exposerReveal: { playerId: string; roleId: string } | undefined;
} {
  const exposerAction = nightActions[WerewolfRole.Exposer as string];
  if (
    exposerAction &&
    !isTeamNightAction(exposerAction) &&
    exposerAction.confirmed &&
    exposerAction.targetPlayerId &&
    !existingReveal
  ) {
    const targetAssignment = effectiveAssignments.find(
      (a) => a.playerId === exposerAction.targetPlayerId,
    );
    if (targetAssignment) {
      const newReveal = {
        playerId: exposerAction.targetPlayerId,
        roleId: targetAssignment.roleDefinitionId,
      };
      return { newExposerReveal: newReveal, exposerReveal: newReveal };
    }
  }
  return { newExposerReveal: undefined, exposerReveal: existingReveal };
}
