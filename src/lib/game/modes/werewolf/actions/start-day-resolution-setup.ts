import type { PlayerRoleAssignment } from "@/lib/types";

import { WerewolfRole } from "../roles";
import type {
  AnyNightAction,
  NightResolutionEvent,
  WerewolfNighttimePhase,
  WerewolfRoleTurnState,
} from "../types";
import { isTeamNightAction } from "../types";
import { resolveNightActions } from "../utils";

/**
 * Builds the effective role assignments for a night by applying any mid-game
 * roleOverrides (e.g. Alpha Wolf bite, Village Drunk sober) so all resolution
 * logic uses the current effective role, not the original assignment.
 */
export function buildEffectiveAssignments(
  roleAssignments: PlayerRoleAssignment[],
  roleOverrides: Record<string, string> | undefined,
): PlayerRoleAssignment[] {
  return roleOverrides
    ? roleAssignments.map((a) => {
        const override = roleOverrides[a.playerId];
        return override ? { ...a, roleDefinitionId: override } : a;
      })
    : roleAssignments;
}

/**
 * Builds the priest wards to use during resolution: carries forward existing
 * wards and adds any new ward from this night's Priest action BEFORE resolution
 * so the ward protects the target on the same night it is placed.
 */
export function buildPriestWardsForResolution(
  nightActions: Record<string, AnyNightAction>,
  effectiveAssignments: PlayerRoleAssignment[],
  rs: WerewolfRoleTurnState,
): Record<string, string> {
  const priestWardsForResolution: Record<string, string> = {
    ...(rs.priest?.wards ?? {}),
  };
  const priestAction = nightActions[WerewolfRole.Priest];
  if (
    priestAction &&
    !isTeamNightAction(priestAction) &&
    priestAction.targetPlayerId
  ) {
    const priestPlayerId = effectiveAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.Priest as string),
    )?.playerId;
    if (priestPlayerId) {
      priestWardsForResolution[priestAction.targetPlayerId] = priestPlayerId;
    }
  }
  return priestWardsForResolution;
}

interface RunNightResolutionParams {
  nightPhase: WerewolfNighttimePhase;
  effectiveAssignments: PlayerRoleAssignment[];
  deadPlayerIds: string[];
  rs: WerewolfRoleTurnState;
  priestWardsForResolution: Record<string, string>;
  oldManTimerPlayerId: string | undefined;
  monarchPlayerId: string | undefined;
  monarchKnightedPlayerIds: string[];
}

/**
 * Runs night-action resolution, assembling the optional resolution context
 * (priest wards, once-per-game charges, monarch protection, etc.) from the
 * current role state and this night's derived inputs.
 */
export function runNightResolution(
  p: RunNightResolutionParams,
): NightResolutionEvent[] {
  const { nightPhase, rs } = p;
  return resolveNightActions(
    nightPhase.nightActions,
    p.effectiveAssignments,
    p.deadPlayerIds,
    nightPhase.smitedPlayerIds,
    {
      priestWards: p.priestWardsForResolution,
      toughGuyHitIds: rs.toughGuy?.hitIds,
      ...(p.oldManTimerPlayerId
        ? { oldManTimerPlayerId: p.oldManTimerPlayerId }
        : {}),
      ...(rs.mirrorcaster?.charged ? { mirrorcasterCharged: true } : {}),
      ...(rs.mercenary?.charged ? { mercenaryCharged: true } : {}),
      ...(p.monarchPlayerId
        ? {
            monarchProtection: {
              monarchPlayerId: p.monarchPlayerId,
              monarchKnightedPlayerIds: p.monarchKnightedPlayerIds,
            },
          }
        : {}),
      ...(rs.arsonist?.dousedPlayerIds.length
        ? { arsonistDousedPlayerIds: rs.arsonist.dousedPlayerIds }
        : {}),
    },
  );
}

/**
 * Resolves the Monarch's player ID (from original assignments) for the current
 * game, or undefined if there is no Monarch in play.
 */
export function findMonarchPlayerId(
  roleAssignments: PlayerRoleAssignment[],
): string | undefined {
  return roleAssignments.find(
    (assignment) =>
      assignment.roleDefinitionId === (WerewolfRole.Monarch as string),
  )?.playerId;
}
