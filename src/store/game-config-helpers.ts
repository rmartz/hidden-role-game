import { sum } from "lodash";

import { GAME_MODES, getAdvancedBucketMaxCapacity } from "@/lib/game/modes";
import type { ModeConfig, RoleBucket, SimpleRoleBucket } from "@/lib/types";
import { GameMode, isSimpleRoleBucket, RoleConfigMode } from "@/lib/types";

import type { GameConfigState } from "./game-config-state";

export function computeIsValid(
  gameMode: GameMode,
  playerCount: number,
  roleConfigMode: RoleConfigMode,
  roleCounts: Record<string, number>,
  roleBuckets: RoleBucket[],
  modeConfig: ModeConfig,
): boolean {
  const modeDefinition = GAME_MODES[gameMode];
  if (roleConfigMode === RoleConfigMode.Default) {
    return playerCount >= modeDefinition.minPlayers;
  }
  if (roleConfigMode === RoleConfigMode.Advanced) {
    if (roleBuckets.length === 0) return false;
    const totalPlayerCount = sum(roleBuckets.map((b) => b.playerCount));
    const required =
      modeDefinition.resolveRoleSlotsRequired?.(playerCount, modeConfig) ??
      modeDefinition.roleSlotsRequired?.(playerCount) ??
      playerCount;
    if (totalPlayerCount !== required) return false;
    // Each advanced bucket must have enough draw capacity to fill its playerCount.
    for (const bucket of roleBuckets) {
      if (isSimpleRoleBucket(bucket)) continue;
      if (getAdvancedBucketMaxCapacity(bucket) < bucket.playerCount)
        return false;
    }
    // Aggregate simple bucket counts for mode-specific validation.
    const simpleCounts: Record<string, number> = {};
    for (const bucket of roleBuckets) {
      if (!isSimpleRoleBucket(bucket)) continue;
      simpleCounts[bucket.roleId] =
        (simpleCounts[bucket.roleId] ?? 0) + bucket.playerCount;
    }
    if (modeDefinition.validateRoleConfig?.(simpleCounts)) return false;
    return true;
  }
  // Custom mode
  if (modeDefinition.validateRoleConfig?.(roleCounts)) return false;
  if (modeDefinition.resolveIsValidRoleCount) {
    return modeDefinition.resolveIsValidRoleCount(
      playerCount,
      roleCounts,
      modeConfig,
    );
  }
  if (modeDefinition.isValidRoleCount) {
    return modeDefinition.isValidRoleCount(playerCount, roleCounts);
  }
  return sum(Object.values(roleCounts)) === playerCount;
}

/**
 * Returns the number of role slots to pass to `defaultRoleCount` for a given
 * player count and mode config. Accounts for modes that reserve players as
 * non-role owners (e.g. Werewolf Narrator) and for hidden unassigned roles.
 */
export function defaultRoleSlotCount(
  gameMode: GameMode,
  playerCount: number,
  modeConfig: ModeConfig,
): number {
  const modeDefinition = GAME_MODES[gameMode];
  return (
    modeDefinition.resolveRoleSlotsRequired?.(playerCount, modeConfig) ??
    modeDefinition.roleSlotsRequired?.(playerCount) ??
    playerCount
  );
}

export function roleCountsFromBuckets(
  buckets: RoleBucket[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const bucket of buckets) {
    if (isSimpleRoleBucket(bucket)) {
      counts[bucket.roleId] = (counts[bucket.roleId] ?? 0) + bucket.playerCount;
    }
    // Advanced multi-role buckets don't map to a simple per-role count
  }
  return counts;
}

export function roleBucketsFromCounts(
  roleCounts: Record<string, number>,
): SimpleRoleBucket[] {
  return Object.entries(roleCounts)
    .filter(([, count]) => count > 0)
    .map(([roleId, count]) => ({ playerCount: count, roleId }));
}

export function recomputeIsValid(state: GameConfigState): boolean {
  return computeIsValid(
    state.gameMode,
    state.playerCount,
    state.roleConfigMode,
    state.roleCounts,
    state.roleBuckets,
    state.modeConfig,
  );
}
