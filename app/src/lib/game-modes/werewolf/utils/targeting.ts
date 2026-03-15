import { Team } from "@/lib/types";
import type { PlayerRoleAssignment } from "@/lib/types";
import { TargetCategory } from "../types";
import type { AnyNightAction, TargetablePlayer, TeamNightVote } from "../types";
import { WEREWOLF_ROLES } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { isTeamPhaseKey, parseTeamPhaseKey } from "./phase-keys";

/**
 * Returns the list of players eligible to be targeted during a night phase.
 * Excludes the game owner (narrator), dead players, and phase-specific
 * exclusions derived from `visibleRoleAssignments`:
 *   - Team phase: the acting player and all visible teammates are excluded.
 *   - Solo phase, Attack/Investigate category (player view only): the acting
 *     player and any role-visible role-holders are excluded.
 *   - Solo phase, all other categories: no self/role exclusions.
 *
 * Pass `myPlayerId = null` for the narrator view (the narrator is already
 * absent from the players list).
 * Pass `activePhaseKey = ""` and `visibleRoleAssignments = []` when no
 * phase-aware exclusion is needed (e.g. in tests).
 */
export function getTargetablePlayers(
  players: TargetablePlayer[],
  ownerPlayerId: string | undefined,
  deadPlayerIds: string[],
  activePhaseKey: string,
  myPlayerId: string | null,
  visibleRoleAssignments: {
    player: { id: string };
    role: { id: string; team: string };
  }[],
): TargetablePlayer[] {
  const excludeIds: string[] = [];

  if (isTeamPhaseKey(activePhaseKey)) {
    if (myPlayerId) excludeIds.push(myPlayerId);
    const team = parseTeamPhaseKey(activePhaseKey);
    if (team) {
      for (const a of visibleRoleAssignments) {
        if ((a.role.team as Team) === team) excludeIds.push(a.player.id);
      }
    }
  } else {
    const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
      activePhaseKey
    ];
    const restrictsSelf =
      role?.targetCategory === TargetCategory.Attack ||
      role?.targetCategory === TargetCategory.Investigate;
    if (restrictsSelf) {
      if (myPlayerId !== null) excludeIds.push(myPlayerId);
      for (const a of visibleRoleAssignments) {
        if (a.role.id === activePhaseKey) excludeIds.push(a.player.id);
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
 * Returns the alive player IDs that belong to a team phase
 * (have `teamTargeting` and matching team).
 */
export function getTeamPlayerIds(
  roleAssignments: PlayerRoleAssignment[],
  team: Team,
  deadPlayerIds: string[],
): string[] {
  return roleAssignments
    .filter((a) => {
      const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
        a.roleDefinitionId
      ];
      return (
        role?.teamTargeting &&
        role.team === team &&
        !deadPlayerIds.includes(a.playerId)
      );
    })
    .map((a) => a.playerId);
}

/**
 * Returns all player IDs on the given team (alive or dead) so they can be
 * excluded from targeting. Includes any role on the team, not just
 * teamTargeting roles.
 */
export function getTeamMemberPlayerIds(
  roleAssignments: PlayerRoleAssignment[],
  team: Team,
): string[] {
  return roleAssignments
    .filter((a) => {
      const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
        a.roleDefinitionId
      ];
      return role?.team === team;
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
