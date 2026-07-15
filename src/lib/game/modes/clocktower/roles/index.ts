export * from "./_distribution";
export * from "./_types";

import type { ClocktowerRoleDefinition } from "./_types";
import type { ClocktowerRole } from "./_types";
import { CLOCKTOWER_DEMON_ROLES } from "./demons";
import { CLOCKTOWER_MINION_ROLES } from "./minions";
import { CLOCKTOWER_OUTSIDER_ROLES } from "./outsiders";
import { CLOCKTOWER_TOWNSFOLK_ROLES } from "./townsfolk";

// ---------------------------------------------------------------------------
// Role definitions (alphabetical by enum key)
// ---------------------------------------------------------------------------

export const CLOCKTOWER_ROLES: Record<
  ClocktowerRole,
  ClocktowerRoleDefinition
> = {
  ...CLOCKTOWER_TOWNSFOLK_ROLES,
  ...CLOCKTOWER_OUTSIDER_ROLES,
  ...CLOCKTOWER_MINION_ROLES,
  ...CLOCKTOWER_DEMON_ROLES,
} satisfies Record<ClocktowerRole, ClocktowerRoleDefinition>;

/** Returns true if the given string is a known ClocktowerRole. */
export function isClocktowerRole(id: string): id is ClocktowerRole {
  return id in CLOCKTOWER_ROLES;
}

/** Look up a ClocktowerRoleDefinition by string ID, returning undefined if not found. */
export function getClocktowerRole(
  id: string,
): ClocktowerRoleDefinition | undefined {
  if (!isClocktowerRole(id)) return undefined;
  return CLOCKTOWER_ROLES[id];
}
