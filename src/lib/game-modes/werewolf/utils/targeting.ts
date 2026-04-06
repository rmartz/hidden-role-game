import type { PlayerRoleAssignment } from "@/lib/types";
import { TargetCategory } from "../types";
import type { AnyNightAction, TargetablePlayer, TeamNightVote } from "../types";
import { WerewolfRole, WEREWOLF_ROLES, getWerewolfRole } from "../roles";
import { isGroupPhaseKey, baseGroupPhaseKey } from "./phase-keys";

/**
 * Returns the list of players eligible to be targeted during a night phase.
 * Excludes the game owner (narrator), dead players, and phase-specific
 * exclusions derived from `visibleRoleAssignments`:
 *   - Group phase: the acting player and all visible teammates are excluded.
 *   - Solo phase, Attack/Investigate category (player view only): the acting
 *     player and any role-visible role-holders are excluded.
 *   - Solo phase, all other categories: no self/role exclusions.
 *
 * Pass `myPlayerId = undefined` for the narrator view (the narrator is already
 * absent from the players list).
 * Pass `activePhaseKey = ""` and `visibleRoleAssignments = []` when no
 * phase-aware exclusion is needed (e.g. in tests).
 */
export function getTargetablePlayers(
  players: TargetablePlayer[],
  ownerPlayerId: string | undefined,
  deadPlayerIds: string[],
  activePhaseKey: string,
  myPlayerId: string | undefined,
  visibleRoleAssignments: {
    player: { id: string };
    role?: { id: string; team: string };
  }[],
): TargetablePlayer[] {
  const excludeIds: string[] = [];

  if (isGroupPhaseKey(activePhaseKey)) {
    if (myPlayerId) excludeIds.push(myPlayerId);
    const primaryRole =
      WEREWOLF_ROLES[baseGroupPhaseKey(activePhaseKey) as WerewolfRole];
    for (const a of visibleRoleAssignments) {
      // When role info is present (narrator view), exclude same-team players.
      // When role is absent (player view with wake-partner/aware-of), exclude all.
      if (!a.role || a.role.team === (primaryRole.team as string)) {
        excludeIds.push(a.player.id);
      }
    }
  } else {
    const role = getWerewolfRole(activePhaseKey);
    const restrictsSelf =
      role?.targetCategory === TargetCategory.Attack ||
      role?.targetCategory === TargetCategory.Investigate ||
      role?.preventSelfTarget === true;
    if (restrictsSelf) {
      if (myPlayerId !== undefined) excludeIds.push(myPlayerId);
      for (const a of visibleRoleAssignments) {
        if (a.role?.id === activePhaseKey) excludeIds.push(a.player.id);
      }
    }
  }

  return players.filter((p) => {
    if (p.id === ownerPlayerId) return false;
    if (deadPlayerIds.includes(p.id)) return false;
    if (excludeIds.includes(p.id)) return false;
    return true;
  });
}

/**
 * Returns the alive player IDs that participate in a group phase:
 * the primary role (teamTargeting) and any roles with `wakesWith` pointing to it.
 */
export function getGroupPhasePlayerIds(
  roleAssignments: PlayerRoleAssignment[],
  phaseKey: string,
  deadPlayerIds: string[],
): string[] {
  const baseKey = baseGroupPhaseKey(phaseKey);
  return roleAssignments
    .filter((a) => {
      if (deadPlayerIds.includes(a.playerId)) return false;
      if (a.roleDefinitionId === baseKey) return true;
      const role = WEREWOLF_ROLES[a.roleDefinitionId as WerewolfRole];
      return (role.wakesWith as string | undefined) === baseKey;
    })
    .map((a) => a.playerId);
}

/**
 * Returns all player IDs who participate in the group phase (alive or dead),
 * based on matching the primary role ID or wakesWith. Hidden allies (e.g.
 * Wizard, Minion) who share the team but don't wake with the group are NOT
 * included — they can be targeted by the group.
 */
export function getGroupPhaseMemberIds(
  roleAssignments: PlayerRoleAssignment[],
  phaseKey: string,
): string[] {
  const baseKey = baseGroupPhaseKey(phaseKey);
  return roleAssignments
    .filter((a) => {
      if (a.roleDefinitionId === baseKey) return true;
      const role = WEREWOLF_ROLES[a.roleDefinitionId as WerewolfRole];
      return (role.wakesWith as string | undefined) === baseKey;
    })
    .map((a) => a.playerId);
}

/**
 * Returns the most-voted target from a list of team votes.
 * Returns undefined if there are no votes or a tie for the top spot.
 */
export function computeSuggestedTarget(
  votes: TeamNightVote[],
): string | undefined {
  if (votes.length === 0) return undefined;

  const counts = new Map<string, number>();
  for (const v of votes) {
    if (v.skipped || !v.targetPlayerId) continue;
    counts.set(v.targetPlayerId, (counts.get(v.targetPlayerId) ?? 0) + 1);
  }

  let maxCount = 0;
  let maxTarget: string | undefined;
  let tied = false;

  for (const [target, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxTarget = target;
      tied = false;
    } else if (count === maxCount) {
      tied = true;
    }
  }

  return tied ? undefined : maxTarget;
}

/** Extracts the targeted player ID from any night action type. */
export function targetPlayerIdOf(a: AnyNightAction): string | undefined {
  if ("targetPlayerId" in a) return a.targetPlayerId;
  if ("suggestedTargetId" in a) return a.suggestedTargetId;
  return undefined;
}

/** Extracts the single active target + confirmed state from any night action type. */
export function getSoloTarget(action: AnyNightAction | undefined): {
  targetPlayerId: string | undefined;
  confirmed: boolean;
} {
  if (!action) return { targetPlayerId: undefined, confirmed: false };
  if ("votes" in action) {
    return {
      targetPlayerId: action.suggestedTargetId,
      confirmed: action.confirmed ?? false,
    };
  }
  return {
    targetPlayerId: action.targetPlayerId,
    confirmed: action.confirmed ?? false,
  };
}
