import { Team } from "@/lib/types";
import type { PlayerRoleAssignment } from "@/lib/types";
import { TargetCategory } from "../types";
import type { AnyNightAction, NightResolutionEvent } from "../types";
import { WEREWOLF_ROLES } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { isTeamPhaseKey } from "./phase-keys";

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
  // Collect attacks: map targetPlayerId → attacking phase keys
  const attacks = new Map<string, string[]>();
  // Collect protections: map targetPlayerId → protecting phase keys
  const protections = new Map<string, string[]>();

  const allTeamBadDead = roleAssignments
    .filter((a) => {
      const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
        a.roleDefinitionId
      ];
      return role?.team === Team.Bad;
    })
    .every((a) => deadPlayerIds.includes(a.playerId));

  for (const [phaseKey, action] of Object.entries(nightActions)) {
    if (isTeamPhaseKey(phaseKey)) {
      // Team phase — attack target is suggestedTargetId
      const teamAction = action as {
        votes: unknown[];
        suggestedTargetId?: string;
      };
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
      // Chupacabra: only attacks if target is Team.Bad or all Team.Bad are dead
      if (phaseKey === "werewolf-chupacabra") {
        const targetAssignment = roleAssignments.find(
          (a) => a.playerId === tid,
        );
        const targetRole = targetAssignment
          ? (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
              targetAssignment.roleDefinitionId
            ]
          : undefined;
        const targetIsTeamBad = targetRole?.team === Team.Bad;
        if (!targetIsTeamBad && !allTeamBadDead) continue;
      }
      attacks.set(tid, [...(attacks.get(tid) ?? []), phaseKey]);
    }
  }

  const events: NightResolutionEvent[] = [];
  for (const [targetPlayerId, attackedBy] of attacks) {
    const protectedBy = protections.get(targetPlayerId) ?? [];
    events.push({
      targetPlayerId,
      attackedBy,
      protectedBy,
      died: protectedBy.length === 0,
    });
  }

  return events;
}
