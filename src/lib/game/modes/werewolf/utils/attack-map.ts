import type { PlayerRoleAssignment } from "@/lib/types";

import { getWerewolfRole, WerewolfRole } from "../roles";
import type { AnyNightAction, NightResolutionEvent } from "../types";
import { TargetCategory } from "../types";
import { isGroupPhaseKey, isRoleActive } from "./phase-keys";

function allWerewolvesAreDead(
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
): boolean {
  return roleAssignments
    .filter((a) => {
      const role = getWerewolfRole(a.roleDefinitionId);
      return role?.isWerewolf === true;
    })
    .every((a) => deadPlayerIds.includes(a.playerId));
}

function chupacabraAttackApplies(
  targetPlayerId: string,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
): boolean {
  const targetAssignment = roleAssignments.find(
    (a) => a.playerId === targetPlayerId,
  );
  const targetRole = targetAssignment
    ? getWerewolfRole(targetAssignment.roleDefinitionId)
    : undefined;
  return (
    targetRole?.isWerewolf === true ||
    allWerewolvesAreDead(roleAssignments, deadPlayerIds)
  );
}

/** Removes all occurrences of `value` from `map[key]`, deleting the key if it becomes empty. */
export function removeFromMapSet(
  map: Map<string, string[]>,
  key: string,
  value: string,
): void {
  const existing = map.get(key) ?? [];
  const filtered = existing.filter((v) => v !== value);
  if (filtered.length === 0) {
    map.delete(key);
  } else {
    map.set(key, filtered);
  }
}

/**
 * Collects attacks and protections from all non-Witch, non-Spellcaster actions.
 * Returns the base attack/protect maps used by both full resolution and the
 * interim attacked-player query for the Witch.
 */
export function collectBaseAttacksAndProtections(
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
  mirrorcasterCharged?: boolean,
  mercenaryCharged?: boolean,
): {
  attacks: Map<string, string[]>;
  protections: Map<string, string[]>;
} {
  const attacks = new Map<string, string[]>();
  const protections = new Map<string, string[]>();

  for (const [phaseKey, action] of Object.entries(nightActions)) {
    // Witch and Spellcaster are handled separately below.
    // Priest protection is handled via priestWards, not the generic Protect pipeline.
    // Altruist intercept is applied after this loop.
    // Swapper swap is applied after Altruist intercept.
    if (
      isRoleActive(phaseKey, [
        WerewolfRole.Witch,
        WerewolfRole.Spellcaster,
        WerewolfRole.Priest,
        WerewolfRole.Altruist,
        WerewolfRole.Swapper,
      ])
    )
      continue;

    if (isGroupPhaseKey(phaseKey)) {
      const groupAction = action as { suggestedTargetId?: string };
      if (!groupAction.suggestedTargetId) continue;
      const tid = groupAction.suggestedTargetId;
      attacks.set(tid, [...(attacks.get(tid) ?? []), phaseKey]);
      continue;
    }

    const soloAction = action as { targetPlayerId?: string };
    if (!soloAction.targetPlayerId) continue;
    const tid = soloAction.targetPlayerId;

    const role = getWerewolfRole(phaseKey);
    if (!role) continue;

    if (role.targetCategory === TargetCategory.Protect) {
      protections.set(tid, [...(protections.get(tid) ?? []), phaseKey]);
      continue;
    }

    if (role.targetCategory === TargetCategory.Attack) {
      if (
        isRoleActive(phaseKey, WerewolfRole.Chupacabra) &&
        !chupacabraAttackApplies(tid, roleAssignments, deadPlayerIds)
      ) {
        continue;
      }
      attacks.set(tid, [...(attacks.get(tid) ?? []), phaseKey]);
      continue;
    }

    // Mirrorcaster: acts as Protect when uncharged, Attack when charged.
    if (isRoleActive(phaseKey, WerewolfRole.Mirrorcaster)) {
      if (mirrorcasterCharged) {
        attacks.set(tid, [...(attacks.get(tid) ?? []), phaseKey]);
      } else {
        protections.set(tid, [...(protections.get(tid) ?? []), phaseKey]);
      }
    }

    // Mercenary: acts as Protect when uncharged (no combat effect when charged — bribe only).
    if (isRoleActive(phaseKey, WerewolfRole.Mercenary)) {
      if (!mercenaryCharged) {
        protections.set(tid, [...(protections.get(tid) ?? []), phaseKey]);
      }
    }
  }

  return { attacks, protections };
}

export function buildKilledEvents(
  attacks: Map<string, string[]>,
  protections: Map<string, string[]>,
): NightResolutionEvent[] {
  return Array.from(attacks.entries()).map(([targetPlayerId, attackedBy]) => {
    const protectedBy = protections.get(targetPlayerId) ?? [];
    return {
      type: "killed" as const,
      targetPlayerId,
      attackedBy,
      protectedBy,
      died: protectedBy.length === 0,
    };
  });
}

/** Adds priest ward protections to the protections map for any warded player under attack. */
export function applyPriestWards(
  attacks: Map<string, string[]>,
  protections: Map<string, string[]>,
  priestWards: Record<string, string>,
): void {
  for (const wardedPlayerId of Object.keys(priestWards)) {
    if (attacks.has(wardedPlayerId)) {
      protections.set(wardedPlayerId, [
        ...(protections.get(wardedPlayerId) ?? []),
        WerewolfRole.Priest,
      ]);
    }
  }
}

/** Adds Arsonist ignite attacks to the attacks map when the Arsonist self-targeted. */
export function applyArsonistIgnite(
  attacks: Map<string, string[]>,
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  arsonistDousedPlayerIds: string[] | undefined,
): void {
  if (!arsonistDousedPlayerIds?.length) return;
  const arsonistAction = nightActions[WerewolfRole.Arsonist] as
    | { targetPlayerId?: string }
    | undefined;
  const arsonistPlayerId = roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.Arsonist as string),
  )?.playerId;
  if (
    arsonistAction?.targetPlayerId &&
    arsonistAction.targetPlayerId === arsonistPlayerId
  ) {
    for (const dousedId of arsonistDousedPlayerIds) {
      attacks.set(dousedId, [
        ...(attacks.get(dousedId) ?? []),
        WerewolfRole.Arsonist,
      ]);
    }
  }
}

/**
 * Returns player IDs who are currently attacked but not yet protected,
 * excluding the Witch's own action. Used to show the Witch their available
 * targets before they act. Also considers priest wards and Arsonist ignite.
 */
export function getInterimAttackedPlayerIds(
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
  priestWards?: Record<string, string>,
  mirrorcasterCharged?: boolean,
  mercenaryCharged?: boolean,
  arsonistDousedPlayerIds?: string[],
): string[] {
  const { attacks, protections } = collectBaseAttacksAndProtections(
    nightActions,
    roleAssignments,
    deadPlayerIds,
    mirrorcasterCharged,
    mercenaryCharged,
  );
  applyArsonistIgnite(
    attacks,
    nightActions,
    roleAssignments,
    arsonistDousedPlayerIds,
  );
  if (priestWards) applyPriestWards(attacks, protections, priestWards);
  return Array.from(attacks.keys()).filter((id) => !protections.has(id));
}
