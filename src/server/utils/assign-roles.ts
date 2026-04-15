import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleBucket,
} from "@/lib/types";
import type { RoleSlot } from "@/server/types";

/**
 * Assigns roles to players using required + possible slot logic.
 *
 * For each slot, `min` roles are guaranteed (required). The remaining
 * `max - min` per slot form a possible pool. From the possible pool,
 * `numPlayers - totalRequired` slots are randomly selected. Required
 * and selected possible slots are then combined and shuffled.
 *
 * For exact slots (min === max), the possible pool is empty and this
 * behaves identically to the previous fixed-count implementation.
 */
export function assignRoles(
  players: LobbyPlayer[],
  roleSlots: RoleSlot[],
): PlayerRoleAssignment[] {
  const numPlayers = players.length;

  // Build required list and possible pool.
  const required: string[] = [];
  const possible: string[] = [];
  for (const slot of roleSlots) {
    for (let i = 0; i < slot.min; i++) required.push(slot.roleId);
    for (let i = slot.min; i < slot.max; i++) possible.push(slot.roleId);
  }

  // Fisher-Yates shuffle the possible pool, then take the first numExtra.
  const numExtra = numPlayers - required.length;
  for (let i = possible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = possible[i];
    if (tmp === undefined || possible[j] === undefined)
      throw new Error("Index out of bounds during shuffle");
    possible[i] = possible[j];
    possible[j] = tmp;
  }

  // Combine required + selected extras, then shuffle the full list.
  const roleIds = [...required, ...possible.slice(0, numExtra)];
  for (let i = roleIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = roleIds[i];
    if (tmp === undefined || roleIds[j] === undefined)
      throw new Error("Index out of bounds during shuffle");
    roleIds[i] = roleIds[j];
    roleIds[j] = tmp;
  }

  return players.map((p, i) => {
    const roleDefinitionId = roleIds[i];
    if (roleDefinitionId === undefined)
      throw new Error(`No role for player at index ${String(i)}`);
    return { playerId: p.id, roleDefinitionId };
  });
}

function fisherYates(arr: string[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    if (tmp === undefined || arr[j] === undefined)
      throw new Error("Index out of bounds during shuffle");
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

/**
 * Draws `count` role IDs from one bucket's role pool.
 *
 * For each role slot:
 *   - `min` copies are required (guaranteed drawn).
 *   - Unique roles (max: 1): at most `max - min` additional copies in the possible pool.
 *   - Non-unique roles (max: undefined): `count` additional copies in the possible pool,
 *     giving them a chance to fill any remaining slots.
 *
 * The possible pool is shuffled and the first `count - required` entries are taken.
 */
function drawFromBucket(bucket: RoleBucket): string[] {
  const required: string[] = [];
  const possible: string[] = [];
  for (const slot of bucket.roles) {
    for (let i = 0; i < slot.min; i++) required.push(slot.roleId);
    if (slot.max === undefined) {
      // Non-unique: add enough copies to potentially fill the whole bucket.
      for (let i = 0; i < bucket.playerCount; i++) possible.push(slot.roleId);
    } else {
      for (let i = slot.min; i < slot.max; i++) possible.push(slot.roleId);
    }
  }

  fisherYates(possible);
  const numExtra = bucket.playerCount - required.length;
  return [...required, ...possible.slice(0, numExtra)];
}

/**
 * Assigns roles to players using bucket-based drawing.
 *
 * Each bucket independently draws `playerCount` roles from its own pool.
 * All drawn roles are combined, shuffled, and assigned to players.
 */
export function assignRolesFromBuckets(
  players: LobbyPlayer[],
  buckets: RoleBucket[],
): PlayerRoleAssignment[] {
  const roleIds: string[] = [];
  for (const bucket of buckets) {
    roleIds.push(...drawFromBucket(bucket));
  }
  fisherYates(roleIds);

  return players.map((p, i) => {
    const roleDefinitionId = roleIds[i];
    if (roleDefinitionId === undefined)
      throw new Error(`No role for player at index ${String(i)}`);
    return { playerId: p.id, roleDefinitionId };
  });
}
