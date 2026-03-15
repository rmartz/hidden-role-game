import { Team } from "@/lib/types";
import type { PlayerRoleAssignment } from "@/lib/types";
import { TargetCategory } from "../types";
import type { AnyNightAction, NightResolutionEvent } from "../types";
import { WEREWOLF_ROLES, WerewolfRole } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { isTeamPhaseKey } from "./phase-keys";

function allTeamBadAreDead(
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
): boolean {
  return roleAssignments
    .filter((a) => {
      const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
        a.roleDefinitionId
      ];
      return role?.team === Team.Bad;
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
    ? (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
        targetAssignment.roleDefinitionId
      ]
    : undefined;
  return (
    targetRole?.team === Team.Bad ||
    allTeamBadAreDead(roleAssignments, deadPlayerIds)
  );
}

function collectAttacksAndProtections(
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
): {
  attacks: Map<string, string[]>;
  protections: Map<string, string[]>;
} {
  const attacks = new Map<string, string[]>();
  const protections = new Map<string, string[]>();

  for (const [phaseKey, action] of Object.entries(nightActions)) {
    if (isTeamPhaseKey(phaseKey)) {
      const teamAction = action as { suggestedTargetId?: string };
      if (!teamAction.suggestedTargetId) continue;
      const tid = teamAction.suggestedTargetId;
      attacks.set(tid, [...(attacks.get(tid) ?? []), phaseKey]);
      continue;
    }

    const soloAction = action as { targetPlayerId?: string };
    if (!soloAction.targetPlayerId) continue;
    const tid = soloAction.targetPlayerId;

    const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
      phaseKey
    ];
    if (!role) continue;

    if (role.targetCategory === TargetCategory.Protect) {
      protections.set(tid, [...(protections.get(tid) ?? []), phaseKey]);
      continue;
    }

    if (role.targetCategory === TargetCategory.Attack) {
      if (
        (phaseKey as WerewolfRole) === WerewolfRole.Chupacabra &&
        !chupacabraAttackApplies(tid, roleAssignments, deadPlayerIds)
      ) {
        continue;
      }
      attacks.set(tid, [...(attacks.get(tid) ?? []), phaseKey]);
    }
  }

  return { attacks, protections };
}

function buildResolutionEvents(
  attacks: Map<string, string[]>,
  protections: Map<string, string[]>,
): NightResolutionEvent[] {
  return Array.from(attacks.entries()).map(([targetPlayerId, attackedBy]) => {
    const protectedBy = protections.get(targetPlayerId) ?? [];
    return {
      targetPlayerId,
      attackedBy,
      protectedBy,
      died: protectedBy.length === 0,
    };
  });
}

/**
 * Resolves all night actions into a list of outcome events.
 * Only players who were targeted for attack appear in the result.
 * Chupacabra attack only applies if the target is on Team.Bad,
 * or if all Team.Bad players are already dead.
 */
export function resolveNightActions(
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
): NightResolutionEvent[] {
  const { attacks, protections } = collectAttacksAndProtections(
    nightActions,
    roleAssignments,
    deadPlayerIds,
  );
  return buildResolutionEvents(attacks, protections);
}
