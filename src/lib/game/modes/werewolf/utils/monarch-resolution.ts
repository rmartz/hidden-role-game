import type { PlayerRoleAssignment } from "@/lib/types";
import { Team } from "@/lib/types";

import { getWerewolfRole, WerewolfRole } from "../roles";
import { isGroupPhaseKey } from "./phase-keys";
import { getGroupPhasePlayerIds } from "./targeting";

function getAttackerIds(
  attackedBy: string[],
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
): string[] {
  const attackerIds = new Set<string>();
  for (const phaseKey of attackedBy) {
    if (isGroupPhaseKey(phaseKey)) {
      for (const playerId of getGroupPhasePlayerIds(
        roleAssignments,
        phaseKey,
        deadPlayerIds,
      )) {
        attackerIds.add(playerId);
      }
      continue;
    }
    const attacker = roleAssignments.find(
      (assignment) =>
        assignment.roleDefinitionId === phaseKey &&
        !deadPlayerIds.includes(assignment.playerId),
    );
    if (attacker) attackerIds.add(attacker.playerId);
  }
  return [...attackerIds];
}

/**
 * Applies Monarch protection: a knighted player shields the Monarch from attack
 * unless the only living knighted players are Bad and a Bad player is attacking,
 * or the sole living knighted player is themselves the attacker.
 */
export function applyMonarchProtection(
  attacks: Map<string, string[]>,
  protections: Map<string, string[]>,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
  monarchProtection: {
    monarchPlayerId: string;
    monarchKnightedPlayerIds: string[];
  },
): void {
  const { monarchPlayerId, monarchKnightedPlayerIds } = monarchProtection;
  if (!attacks.has(monarchPlayerId)) return;

  const livingKnightedPlayerIds = monarchKnightedPlayerIds.filter(
    (playerId) => !deadPlayerIds.includes(playerId),
  );
  if (livingKnightedPlayerIds.length === 0) return;

  const attackerIds = getAttackerIds(
    attacks.get(monarchPlayerId) ?? [],
    roleAssignments,
    deadPlayerIds,
  );
  const getRoleForPlayer = (playerId: string) => {
    const roleDefinitionId = roleAssignments.find(
      (assignment) => assignment.playerId === playerId,
    )?.roleDefinitionId;
    return roleDefinitionId ? getWerewolfRole(roleDefinitionId) : undefined;
  };
  const livingKnightedRoleDefs = livingKnightedPlayerIds
    .map((playerId) => getRoleForPlayer(playerId))
    .filter((roleDef) => roleDef !== undefined);
  const allLivingKnightedPlayersAreBad = livingKnightedRoleDefs.every(
    (roleDef) => roleDef.team === Team.Bad,
  );
  const badAttackerExists = attackerIds.some((playerId) => {
    const attackerRole = getRoleForPlayer(playerId);
    return attackerRole?.team === Team.Bad;
  });
  const onlyLivingKnightedPlayerId =
    livingKnightedPlayerIds.length === 1
      ? livingKnightedPlayerIds[0]
      : undefined;
  const attackerIsOnlyLivingKnightedPlayer =
    onlyLivingKnightedPlayerId !== undefined &&
    attackerIds.includes(onlyLivingKnightedPlayerId);

  if (
    (badAttackerExists && allLivingKnightedPlayersAreBad) ||
    attackerIsOnlyLivingKnightedPlayer
  ) {
    return;
  }

  protections.set(monarchPlayerId, [
    ...(protections.get(monarchPlayerId) ?? []),
    WerewolfRole.Monarch,
  ]);
}
