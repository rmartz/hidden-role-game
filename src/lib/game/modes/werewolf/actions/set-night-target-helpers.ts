import type { Game } from "@/lib/types";

import { getWerewolfRole, WerewolfRole } from "../roles";
import type { WerewolfTurnState } from "../types";
import { TargetCategory, WerewolfPhase } from "../types";
import { getInterimAttackedPlayerIds, isRoleActive } from "../utils";

/**
 * Validates role-specific targeting restrictions for a player (non-owner)
 * setting a night target. Returns `false` if the restriction blocks the
 * action, or `undefined` if no role-specific restriction applies.
 */
export function validateRoleSpecificRestrictions(
  game: Game,
  callerId: string,
  phaseKey: string,
  targetPlayerId: string,
  ts: WerewolfTurnState,
): false | undefined {
  // Priest cannot target when they have an active ward on a living player.
  if (
    isRoleActive(phaseKey, WerewolfRole.Priest) &&
    ts.roleState?.priest?.wards
  ) {
    const hasActiveWard = Object.keys(ts.roleState.priest.wards).some(
      (wardedId) => !ts.deadPlayerIds.includes(wardedId),
    );
    if (hasActiveWard) return false;
  }

  // Attack and Investigate roles cannot target themselves.
  if (targetPlayerId === callerId) {
    const callerAssignment = game.roleAssignments.find(
      (a) => a.playerId === callerId,
    );
    const effectiveCallerRoleId =
      ts.roleOverrides?.[callerId] ?? callerAssignment?.roleDefinitionId;
    const callerRoleDef = effectiveCallerRoleId
      ? getWerewolfRole(effectiveCallerRoleId)
      : undefined;
    if (
      callerRoleDef?.targetCategory === TargetCategory.Attack ||
      callerRoleDef?.targetCategory === TargetCategory.Investigate ||
      callerRoleDef?.preventSelfTarget === true
    )
      return false;
  }

  // Roles with adjacentTargetOnly may only target immediate seating neighbours.
  // Resolve the effective role (honouring roleOverrides, e.g. a Village Drunk
  // sobering into The Thing) so the restriction follows the current role.
  const callerAssignment = game.roleAssignments.find(
    (a) => a.playerId === callerId,
  );
  const effectiveCallerRoleId =
    ts.roleOverrides?.[callerId] ?? callerAssignment?.roleDefinitionId;
  const callerRoleDef = effectiveCallerRoleId
    ? getWerewolfRole(effectiveCallerRoleId)
    : undefined;
  if (callerRoleDef?.adjacentTargetOnly) {
    const rawOrder = game.playerOrder ?? game.players.map((p) => p.id);
    // Exclude the narrator so a player seated next to the narrator still
    // has two selectable neighbours.
    const playerOrder = rawOrder.filter((id) => id !== game.ownerPlayerId);
    const idx = playerOrder.indexOf(callerId);
    if (idx === -1 || playerOrder.length < 2) return false;
    const left =
      playerOrder[(idx - 1 + playerOrder.length) % playerOrder.length];
    const right = playerOrder[(idx + 1) % playerOrder.length];
    if (targetPlayerId !== left && targetPlayerId !== right) return false;
  }

  // Witch cannot self-target unless under attack (self-protect is OK,
  // self-attack is not).
  if (
    isRoleActive(phaseKey, WerewolfRole.Witch) &&
    targetPlayerId === callerId
  ) {
    const attacked = getInterimAttackedPlayerIds(
      ts.phase.type === WerewolfPhase.Nighttime ? ts.phase.nightActions : {},
      game.roleAssignments,
      ts.deadPlayerIds,
      ts.roleState?.priest?.wards,
      ts.roleState?.mirrorcaster?.charged,
      ts.roleState?.mercenary?.charged,
      ts.roleState?.arsonist?.dousedPlayerIds,
    );
    if (!attacked.includes(callerId)) return false;
  }

  return undefined;
}
