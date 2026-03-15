import { TargetCategory } from "../types";
import { WEREWOLF_ROLES } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { isTeamPhaseKey, TEAM_PHASE_PREFIX } from "./phase-keys";

/** Returns a human-readable label for a night phase key. */
export function getPhaseLabel(
  phaseKey: string,
  roles: Record<string, { name: string }>,
): string {
  if (isTeamPhaseKey(phaseKey)) {
    return `${phaseKey.slice(TEAM_PHASE_PREFIX.length)} Team`;
  }
  return roles[phaseKey]?.name ?? phaseKey;
}

/**
 * Returns true if the current night phase is this player's turn.
 * Team phases match by team name; solo phases match by role ID.
 */
export function isPlayersTurn(
  myRole: { id: string; team: string } | null,
  activePhaseKey: string | undefined,
): boolean {
  if (!myRole || !activePhaseKey) return false;
  if (isTeamPhaseKey(activePhaseKey)) {
    return myRole.team === activePhaseKey.slice(TEAM_PHASE_PREFIX.length);
  }
  return myRole.id === activePhaseKey;
}

/**
 * Returns the confirm button label for a given phase key based on its target category.
 * Team phase keys return "Attack". Solo roles: Attack, Protect, Investigate, or "Confirm".
 */
export function getConfirmLabel(phaseKey: string | undefined): string {
  if (!phaseKey) return "Confirm";
  if (isTeamPhaseKey(phaseKey)) return "Attack";
  const roleDef = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
    phaseKey
  ];
  if (!roleDef) return "Confirm";
  switch (roleDef.targetCategory) {
    case TargetCategory.Attack:
      return "Attack";
    case TargetCategory.Protect:
      return "Protect";
    case TargetCategory.Investigate:
      return "Investigate";
    default:
      return "Confirm";
  }
}
