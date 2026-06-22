import type { PlayerRoleAssignment } from "@/lib/types";
import { Team } from "@/lib/types";

import { getWerewolfRole, WerewolfRole } from "../roles";
import type { AnyNightAction, WerewolfRoleTurnState } from "../types";
import { isTeamNightAction } from "../types";

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
