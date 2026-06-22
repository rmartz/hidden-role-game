import type { PlayerRoleAssignment } from "@/lib/types";
import { Team } from "@/lib/types";

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

/**
 * Builds the lastTargets record for roles that prevent consecutive same-player targeting.
 */
export function buildLastTargets(
  nightActions: Record<string, AnyNightAction>,
): Record<string, string> {
  const lastTargets: Record<string, string> = {};
  for (const [phaseKey, action] of Object.entries(nightActions)) {
    if (isTeamNightAction(action)) continue;
    const roleDef = getWerewolfRole(phaseKey);
    if (roleDef?.preventRepeatTarget && action.targetPlayerId) {
      lastTargets[phaseKey] = action.targetPlayerId;
    }
  }
  return lastTargets;
}

/**
 * Applies Vigilante self-death: if the Vigilante killed a Good-team player,
 * they die too (unless already dead).
 */
export function applyVigilanteSelfDeath(
  nightActions: Record<string, AnyNightAction>,
  effectiveAssignments: PlayerRoleAssignment[],
  existingDeadIds: string[],
  newDeadIds: string[],
): void {
  const vigilanteAssignment = effectiveAssignments.find(
    (a) =>
      a.roleDefinitionId === (WerewolfRole.Vigilante as string) &&
      !existingDeadIds.includes(a.playerId) &&
      !newDeadIds.includes(a.playerId),
  );
  if (!vigilanteAssignment) return;

  const vigilanteAction = nightActions[WerewolfRole.Vigilante as string];
  if (
    vigilanteAction &&
    !isTeamNightAction(vigilanteAction) &&
    vigilanteAction.targetPlayerId &&
    newDeadIds.includes(vigilanteAction.targetPlayerId)
  ) {
    const targetAssignment = effectiveAssignments.find(
      (a) => a.playerId === vigilanteAction.targetPlayerId,
    );
    const targetRole = targetAssignment
      ? getWerewolfRole(targetAssignment.roleDefinitionId)
      : undefined;
    if (targetRole?.team === Team.Good) {
      newDeadIds.push(vigilanteAssignment.playerId);
    }
  }
}

/**
 * Checks if the Mortician's ability has ended (they killed a Werewolf this night).
 */
export function computeMorticianAbilityEnded(
  nightActions: Record<string, AnyNightAction>,
  effectiveAssignments: PlayerRoleAssignment[],
  newDeadIds: string[],
  alreadyEnded: boolean,
): boolean {
  if (alreadyEnded) return true;
  const morticianAction = nightActions[WerewolfRole.Mortician as string];
  if (
    morticianAction &&
    !isTeamNightAction(morticianAction) &&
    morticianAction.targetPlayerId &&
    newDeadIds.includes(morticianAction.targetPlayerId)
  ) {
    const targetAssignment = effectiveAssignments.find(
      (a) => a.playerId === morticianAction.targetPlayerId,
    );
    const targetRole = targetAssignment
      ? getWerewolfRole(targetAssignment.roleDefinitionId)
      : undefined;
    return targetRole?.isWerewolf === true;
  }
  return false;
}

interface BuildNewRoleStateParams {
  rs: WerewolfRoleTurnState;
  witchAbilityUsed: boolean;
  wolfCubDied: boolean;
  priestWards: Record<string, string>;
  toughGuyHitIds: string[];
  oneEyedSeerLockedTargetId: string | undefined;
  exposerAbilityUsed: boolean;
  exposerReveal: { playerId: string; roleId: string } | undefined;
  hunterDiedThisNight: boolean;
  hunterPlayerId: string | undefined;
  morticianAbilityEnded: boolean;
  monarchKnightedPlayerIds: string[];
  monarchKnightingsUsed: number;
  mirrorcasterCharged: boolean;
  mercenaryCharged: boolean;
  mercenaryBribedPlayerIds: string[];
  thingTapped: string | undefined;
  draculaWives: string[];
  zombieInfected: string[];
  arsonistDousedPlayerIds: string[];
  illusionTargetId: string | undefined;
  evilEmpathLastResult: boolean | undefined;
  evilEmpathRevealedResult: boolean | undefined;
  veteranAlertsUsed: number;
}

/**
 * Builds the new WerewolfRoleTurnState to carry into the daytime phase.
 * Only includes fields for roles that are active or have relevant state.
 */
export function buildNewRoleState(
  p: BuildNewRoleStateParams,
): WerewolfRoleTurnState {
  return {
    ...(p.rs.alphaWolf?.biteUsed ? { alphaWolf: { biteUsed: true } } : {}),
    ...(p.witchAbilityUsed ? { witch: { abilityUsed: true } } : {}),
    ...(p.wolfCubDied ? { wolfCub: { died: true } } : {}),
    ...(Object.keys(p.priestWards).length > 0
      ? { priest: { wards: p.priestWards } }
      : {}),
    ...(p.toughGuyHitIds.length > 0
      ? { toughGuy: { hitIds: p.toughGuyHitIds } }
      : {}),
    ...(p.oneEyedSeerLockedTargetId
      ? { oneEyedSeer: { lockedTargetId: p.oneEyedSeerLockedTargetId } }
      : {}),
    ...(p.exposerAbilityUsed || p.exposerReveal
      ? {
          exposer: {
            ...(p.exposerAbilityUsed ? { abilityUsed: true as const } : {}),
            ...(p.exposerReveal ? { reveal: p.exposerReveal } : {}),
          },
        }
      : {}),
    ...(p.hunterDiedThisNight && p.hunterPlayerId
      ? { hunter: { revengePlayerId: p.hunterPlayerId } }
      : {}),
    ...(p.rs.martyr?.abilityUsed ? { martyr: p.rs.martyr } : {}),
    ...(p.morticianAbilityEnded ? { mortician: { abilityEnded: true } } : {}),
    ...(p.monarchKnightedPlayerIds.length > 0 || p.monarchKnightingsUsed > 0
      ? {
          monarch: {
            knightedPlayerIds: p.monarchKnightedPlayerIds,
            knightingsUsed: p.monarchKnightingsUsed,
          },
        }
      : {}),
    ...(p.rs.executioner?.targetId
      ? { executioner: { targetId: p.rs.executioner.targetId } }
      : {}),
    ...(p.mirrorcasterCharged ? { mirrorcaster: { charged: true } } : {}),
    ...(p.mercenaryCharged || p.mercenaryBribedPlayerIds.length > 0
      ? {
          mercenary: {
            charged: p.mercenaryCharged,
            bribedPlayerIds: p.mercenaryBribedPlayerIds,
          },
        }
      : {}),
    ...(p.thingTapped ? { theThing: { tapped: p.thingTapped } } : {}),
    ...(p.draculaWives.length > 0
      ? { dracula: { wives: p.draculaWives } }
      : {}),
    ...(p.zombieInfected.length > 0
      ? { zombie: { infected: p.zombieInfected } }
      : {}),
    ...(p.arsonistDousedPlayerIds.length > 0
      ? { arsonist: { dousedPlayerIds: p.arsonistDousedPlayerIds } }
      : {}),
    ...(p.illusionTargetId
      ? { illusionArtist: { illusionTargetId: p.illusionTargetId } }
      : {}),
    ...(p.evilEmpathLastResult !== undefined ||
    p.evilEmpathRevealedResult !== undefined
      ? {
          evilEmpath: {
            ...(p.evilEmpathLastResult !== undefined
              ? { lastResult: p.evilEmpathLastResult }
              : {}),
            ...(p.evilEmpathRevealedResult !== undefined
              ? { revealedResult: p.evilEmpathRevealedResult }
              : {}),
          },
        }
      : {}),
    ...(p.veteranAlertsUsed > 0
      ? { veteran: { alertsUsed: p.veteranAlertsUsed } }
      : {}),
  };
}

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
