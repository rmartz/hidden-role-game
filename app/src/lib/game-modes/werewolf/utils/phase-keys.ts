import { WEREWOLF_ROLES, isWerewolfRole } from "../roles";
import type { WerewolfRole, WerewolfRoleDefinition } from "../roles";

/** A valid night phase key: a role ID. Group phases use the primary role's ID. */
export type PhaseKey = WerewolfRole | string;

/**
 * Separator used to create unique keys for repeated group phases within a single
 * night (e.g. the Wolf Cub bonus attack). The base role ID precedes the separator.
 */
export const GROUP_PHASE_KEY_SEPARATOR = ":";

/**
 * Strips any repetition suffix from a group phase key, returning the base role ID.
 * e.g. "werewolf-werewolf:2" → "werewolf-werewolf", "werewolf-werewolf" → "werewolf-werewolf"
 */
export function baseGroupPhaseKey(phaseKey: string): string {
  const idx = phaseKey.lastIndexOf(GROUP_PHASE_KEY_SEPARATOR);
  return idx === -1 ? phaseKey : phaseKey.slice(0, idx);
}

/**
 * Returns true if `key` matches the specified role (or any role in a list).
 * Works for both phase keys and player role IDs — any string that may be a
 * `WerewolfRole`. Combines the `isWerewolfRole` type guard with an equality
 * check so callers don't need to repeat the guard manually.
 */
export function isRoleActive(
  key: string,
  role: WerewolfRole | WerewolfRole[],
): boolean {
  if (!isWerewolfRole(key)) return false;
  return Array.isArray(role) ? role.includes(key) : key === role;
}

/**
 * Returns true if the given phase key is a group (multi-role voting) phase.
 * A group phase is one whose primary role definition has `teamTargeting: true`.
 * Handles suffixed repeat keys (e.g. "werewolf-werewolf:2").
 */
export function isGroupPhaseKey(phaseKey: string): boolean {
  const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
    baseGroupPhaseKey(phaseKey)
  ];
  return role?.teamTargeting === true;
}
