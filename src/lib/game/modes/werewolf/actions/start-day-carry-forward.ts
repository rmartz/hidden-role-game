import type { PlayerRoleAssignment } from "@/lib/types";

import { WerewolfRole } from "../roles";
import type {
  AnyNightAction,
  NightResolutionEvent,
  WerewolfRoleTurnState,
} from "../types";
import { isTeamNightAction } from "../types";

/**
 * Computes the updated Mirrorcaster charge state for the start of a new day.
 * - If charged and the Mirrorcaster attacked tonight → charge consumed.
 * - If uncharged and the protection target was attacked → gain charge.
 */
export function computeMirrorcasterCharged(
  nightActions: Record<string, AnyNightAction>,
  nightResolution: NightResolutionEvent[],
  rs: WerewolfRoleTurnState,
): boolean {
  if (rs.mirrorcaster?.charged) {
    const mcAction = nightActions[WerewolfRole.Mirrorcaster as string];
    return (
      mcAction === undefined ||
      isTeamNightAction(mcAction) ||
      mcAction.targetPlayerId === undefined
    );
  }
  const mcAction = nightActions[WerewolfRole.Mirrorcaster as string];
  if (
    mcAction !== undefined &&
    !isTeamNightAction(mcAction) &&
    mcAction.targetPlayerId !== undefined
  ) {
    const protectedId = mcAction.targetPlayerId;
    return nightResolution.some(
      (e) =>
        e.type === "killed" &&
        e.targetPlayerId === protectedId &&
        e.protectedBy.includes(WerewolfRole.Mirrorcaster),
    );
  }
  return false;
}

/**
 * Computes updated Mercenary charge and bribed-player state for the start of a new day.
 * - In protect mode (uncharged): if the protection target was attacked → gain charge.
 * - In bribe mode (charged): if a bribe target was submitted → append to bribedPlayerIds and clear charge;
 *   otherwise carry the charge forward.
 */
export function computeMercenaryState(
  nightActions: Record<string, AnyNightAction>,
  nightResolution: NightResolutionEvent[],
  rs: WerewolfRoleTurnState,
): { mercenaryCharged: boolean; mercenaryBribedPlayerIds: string[] } {
  const existingBribes = rs.mercenary?.bribedPlayerIds ?? [];
  const mercAction = nightActions[WerewolfRole.Mercenary as string];

  if (rs.mercenary?.charged) {
    if (
      mercAction !== undefined &&
      !isTeamNightAction(mercAction) &&
      mercAction.targetPlayerId !== undefined
    ) {
      const newBribes = existingBribes.includes(mercAction.targetPlayerId)
        ? existingBribes
        : [...existingBribes, mercAction.targetPlayerId];
      return { mercenaryCharged: false, mercenaryBribedPlayerIds: newBribes };
    }
    return { mercenaryCharged: true, mercenaryBribedPlayerIds: existingBribes };
  }

  if (
    mercAction !== undefined &&
    !isTeamNightAction(mercAction) &&
    mercAction.targetPlayerId !== undefined
  ) {
    const protectedId = mercAction.targetPlayerId;
    const protectionTriggered = nightResolution.some(
      (e) =>
        e.type === "killed" &&
        e.targetPlayerId === protectedId &&
        e.protectedBy.includes(WerewolfRole.Mercenary),
    );
    return {
      mercenaryCharged: protectionTriggered,
      mercenaryBribedPlayerIds: existingBribes,
    };
  }

  return { mercenaryCharged: false, mercenaryBribedPlayerIds: existingBribes };
}

/**
 * Computes the updated Dracula wives list for the start of a new day.
 * Excludes wives who died this night. Adds new wife if Dracula targeted someone
 * who survived.
 */
export function computeDraculaWives(
  nightActions: Record<string, AnyNightAction>,
  rs: WerewolfRoleTurnState,
  updatedDeadIds: string[],
): string[] {
  const draculaAction = nightActions[WerewolfRole.Dracula as string];
  const livingWives = (rs.dracula?.wives ?? []).filter(
    (id) => !updatedDeadIds.includes(id),
  );
  if (
    draculaAction &&
    !isTeamNightAction(draculaAction) &&
    draculaAction.targetPlayerId &&
    !updatedDeadIds.includes(draculaAction.targetPlayerId)
  ) {
    return livingWives.includes(draculaAction.targetPlayerId)
      ? livingWives
      : [...livingWives, draculaAction.targetPlayerId];
  }
  return livingWives;
}

/**
 * Computes the updated Zombie infected list for the start of a new day.
 * Excludes infected who died this night. Adds new infection if Zombie targeted
 * a living player not already infected.
 */
export function computeZombieInfected(
  nightActions: Record<string, AnyNightAction>,
  rs: WerewolfRoleTurnState,
  updatedDeadIds: string[],
): string[] {
  const zombieAction = nightActions[WerewolfRole.Zombie as string];
  const existingInfected = (rs.zombie?.infected ?? []).filter(
    (id) => !updatedDeadIds.includes(id),
  );
  if (
    zombieAction &&
    !isTeamNightAction(zombieAction) &&
    zombieAction.targetPlayerId &&
    !existingInfected.includes(zombieAction.targetPlayerId) &&
    !updatedDeadIds.includes(zombieAction.targetPlayerId)
  ) {
    return [...existingInfected, zombieAction.targetPlayerId];
  }
  return existingInfected;
}

/**
 * Computes the updated Arsonist doused player list for the start of a new day.
 * - Self-target (ignite) resets the list.
 * - Targeting another living player adds them to the list.
 * - Dead players are pruned from the list regardless.
 */
export function computeArsonistDousedPlayerIds(
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  rs: WerewolfRoleTurnState,
  updatedDeadIds: string[],
): string[] {
  const arsonistAssignment = roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.Arsonist as string),
  );
  const arsonistAction = nightActions[WerewolfRole.Arsonist as string];
  let dousedPlayerIds = (rs.arsonist?.dousedPlayerIds ?? []).filter(
    (id) => !updatedDeadIds.includes(id),
  );

  if (
    arsonistAssignment &&
    arsonistAction &&
    !isTeamNightAction(arsonistAction) &&
    arsonistAction.targetPlayerId
  ) {
    if (arsonistAction.targetPlayerId === arsonistAssignment.playerId) {
      dousedPlayerIds = [];
    } else if (
      !updatedDeadIds.includes(arsonistAssignment.playerId) &&
      !dousedPlayerIds.includes(arsonistAction.targetPlayerId) &&
      !updatedDeadIds.includes(arsonistAction.targetPlayerId)
    ) {
      dousedPlayerIds = [...dousedPlayerIds, arsonistAction.targetPlayerId];
    }
  }

  return dousedPlayerIds;
}
