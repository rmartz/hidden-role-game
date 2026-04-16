import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleBucket,
  RoleDefinition,
} from "@/lib/types";
import { Team, isSimpleRoleBucket } from "@/lib/types";

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

/**
 * Returns true if removing the role at `candidateIndex` from `roleIds` is safe,
 * i.e. there remains at least one Bad or Neutral role in the pool.
 */
function isSafeToHide(
  candidateIndex: number,
  roleIds: string[],
  roles: Record<string, RoleDefinition<string, Team>>,
): boolean {
  const candidateRoleId = roleIds[candidateIndex];
  if (!candidateRoleId) return true; // candidateIndex is out of bounds (should not happen given caller uses findIndex)
  const candidateRole = roles[candidateRoleId];
  if (!candidateRole) return true; // Unknown role — allow removal
  const isBadOrNeutral =
    candidateRole.team === Team.Bad || candidateRole.team === Team.Neutral;
  if (!isBadOrNeutral) return true; // Good roles can always be removed

  // Count how many Bad/Neutral roles remain after removing this specific occurrence.
  const badOrNeutralRemaining = roleIds.filter((id, i) => {
    if (i === candidateIndex) return false; // skip this occurrence
    const r = roles[id];
    return r && (r.team === Team.Bad || r.team === Team.Neutral);
  });
  return badOrNeutralRemaining.length >= 1;
}

/**
 * Assigns roles to players, randomly selecting `hiddenCount` roles to exclude.
 *
 * The role buckets must contain `players.length + hiddenCount` roles total.
 * Hidden roles are selected randomly with a safety constraint: removing a
 * Bad or Neutral role is only allowed if at least one Bad/Neutral role
 * remains in the assigned pool.
 *
 * Returns the player role assignments and the hidden role IDs.
 */
export function assignRolesFromBucketsWithHidden(
  players: LobbyPlayer[],
  buckets: RoleBucket[],
  hiddenCount: number,
  roles: Record<string, RoleDefinition<string, Team>>,
): { assignments: PlayerRoleAssignment[]; hiddenRoleIds: string[] } {
  const allRoleIds: string[] = [];
  for (const bucket of buckets) {
    allRoleIds.push(...drawFromBucket(bucket));
  }
  fisherYates(allRoleIds);

  if (allRoleIds.length !== players.length + hiddenCount) {
    throw new Error(
      `Expected ${String(players.length + hiddenCount)} roles for ${String(players.length)} players + ${String(hiddenCount)} hidden, got ${String(allRoleIds.length)}`,
    );
  }

  const hiddenRoleIds: string[] = [];
  const remainingRoleIds = [...allRoleIds];

  for (let i = 0; i < hiddenCount; i++) {
    // Find the first candidate (in shuffled order) that is safe to hide.
    const candidateIndex = remainingRoleIds.findIndex((_, idx) =>
      isSafeToHide(idx, remainingRoleIds, roles),
    );
    if (candidateIndex === -1) {
      throw new Error(
        "Cannot hide any more roles: removing any remaining role would leave no Bad or Neutral roles in the game.",
      );
    }
    const [hidden] = remainingRoleIds.splice(candidateIndex, 1);
    if (!hidden) throw new Error("Unexpected empty splice result");
    hiddenRoleIds.push(hidden);
  }

  const assignments = players.map((p, i) => {
    const roleDefinitionId = remainingRoleIds[i];
    if (roleDefinitionId === undefined)
      throw new Error(`No role for player at index ${String(i)}`);
    return { playerId: p.id, roleDefinitionId };
  });

  return { assignments, hiddenRoleIds };
}
