import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleBucket,
} from "@/lib/types";
import { isSimpleRoleBucket } from "@/lib/types";

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
 * Draws `playerCount` role IDs from one bucket's role pool.
 *
 * Simple buckets always draw `playerCount` copies of their single role.
 *
 * Advanced buckets use min/max constraints per slot:
 *   - `min` copies are required (guaranteed drawn).
 *   - Unique roles (max set): at most `max - min` additional copies in the possible pool.
 *   - Non-unique roles (max: undefined): `playerCount` copies in the possible pool,
 *     giving them a chance to fill any remaining slots.
 *
 * The possible pool is shuffled and the first `playerCount - required` entries are taken.
 */
function drawFromBucket(bucket: RoleBucket): string[] {
  if (isSimpleRoleBucket(bucket)) {
    return Array.from({ length: bucket.playerCount }, () => bucket.roleId);
  }

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
