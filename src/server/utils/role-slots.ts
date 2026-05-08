import type {
  AdvancedRoleBucket,
  ModeConfig,
  RoleBucket,
  GameMode,
} from "@/lib/types";
import { isSimpleRoleBucket } from "@/lib/types";
import { getModeDefinition } from "@/lib/game/state";
import {
  getAdvancedBucketMaxCapacity,
  getRoleSlotsRequired,
} from "@/lib/game/modes";

/**
 * Validates that an advanced bucket's role pool can fill its playerCount.
 * Checks that total draw capacity (sum of max, or playerCount for non-unique) >= playerCount.
 */
function validateAdvancedBucketFeasibility(
  bucket: AdvancedRoleBucket,
): string | undefined {
  const maxCapacity = getAdvancedBucketMaxCapacity(bucket);
  if (maxCapacity < bucket.playerCount) {
    return `Bucket can fill at most ${String(maxCapacity)} of ${String(bucket.playerCount)} player slots`;
  }
  return undefined;
}

/**
 * Validates that all role IDs in a set of buckets are known for the given game mode,
 * and that advanced bucket constraints are feasible.
 * Also runs any mode-specific role-count constraints (e.g. Mason must be 0 or 2+).
 * Mode-specific validation only receives deterministic simple-bucket counts; advanced
 * bucket slots are non-deterministic and are excluded from that check.
 * Returns an error message, or undefined if all are valid.
 */
export function validateRoleBucketsForMode(
  buckets: RoleBucket[],
  gameMode: GameMode,
): string | undefined {
  const modeDefinition = getModeDefinition(gameMode);
  const { roles } = modeDefinition;
  const simpleCounts: Record<string, number> = {};
  for (const bucket of buckets) {
    if (isSimpleRoleBucket(bucket)) {
      if (!(bucket.roleId in roles)) return `Unknown role: ${bucket.roleId}`;
      simpleCounts[bucket.roleId] =
        (simpleCounts[bucket.roleId] ?? 0) + bucket.playerCount;
    } else {
      for (const slot of bucket.roles) {
        if (!(slot.roleId in roles)) return `Unknown role: ${slot.roleId}`;
      }
      const feasibilityError = validateAdvancedBucketFeasibility(bucket);
      if (feasibilityError) return feasibilityError;
    }
  }
  return modeDefinition.validateRoleConfig?.(simpleCounts);
}

/**
 * Validates that role buckets can accommodate a specific player count.
 * The sum of all bucket playerCounts must equal the required slot count.
 */
export function validateRoleBucketsCoverPlayerCount(
  buckets: RoleBucket[],
  gameMode: GameMode,
  playerCount: number,
  modeConfig?: ModeConfig,
): string | undefined {
  const required = getRoleSlotsRequired(gameMode, playerCount, modeConfig);
  const total = buckets.reduce((sum, b) => sum + b.playerCount, 0);
  if (total !== required) {
    return "Role bucket player counts must sum to the required player count";
  }
  return undefined;
}
