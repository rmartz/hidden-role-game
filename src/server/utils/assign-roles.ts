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
 * Advanced buckets draw randomly from a weighted pool:
 *   - Non-unique roles (max: undefined): `playerCount` copies in the pool,
 *     giving them a proportional chance to fill any slot.
 *   - Unique roles (max set): at most `max` copies in the pool.
 *
 * The pool is shuffled and the first `playerCount` entries are taken.
 */
function drawFromBucket(bucket: RoleBucket): string[] {
  if (isSimpleRoleBucket(bucket)) {
    return Array.from({ length: bucket.playerCount }, () => bucket.roleId);
  }

  const pool: string[] = [];
  for (const slot of bucket.roles) {
    const copies = slot.max ?? bucket.playerCount;
    for (let i = 0; i < copies; i++) pool.push(slot.roleId);
  }

  fisherYates(pool);
  if (pool.length < bucket.playerCount) {
    throw new Error(
      `Bucket can only draw ${String(pool.length)} roles for ${String(bucket.playerCount)} players`,
    );
  }
  return pool.slice(0, bucket.playerCount);
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
