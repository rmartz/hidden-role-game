import { WEREWOLF_ROLES } from "../roles";
import type { WerewolfRole, WerewolfRoleDefinition } from "../roles";

/** A valid night phase key: a role ID. Group phases use the primary role's ID. */
export type PhaseKey = WerewolfRole | string;

/**
 * Returns true if the given phase key is a group (multi-role voting) phase.
 * A group phase is one whose primary role definition has `teamTargeting: true`.
 */
export function isGroupPhaseKey(phaseKey: string): boolean {
  const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
    phaseKey
  ];
  return role?.teamTargeting === true;
}
