import type {
  AdvancedRoleBucket,
  ModeConfig,
  RoleBucket,
  GameMode,
} from "@/lib/types";
import { isSimpleRoleBucket } from "@/lib/types";
import { getModeDefinition } from "@/lib/game/state";
import { getRoleSlotsRequired } from "@/lib/game/modes";

/**
 * Validates that an advanced bucket's role constraints can fill its playerCount.
 * Checks that sum(min) <= playerCount and total draw capacity >= playerCount.
 */
function validateAdvancedBucketFeasibility(
  bucket: AdvancedRoleBucket,
): string | undefined {
  let requiredCount = 0;
  let maxCapacity = 0;
  for (const slot of bucket.roles) {
    if (slot.max !== undefined && slot.max < slot.min) {
      return `Role "${slot.roleId}" has max (${String(slot.max)}) less than min (${String(slot.min)})`;
    }
    requiredCount += slot.min;
    // Non-unique roles can fill the whole bucket; unique roles are capped at max.
    maxCapacity += slot.max ?? bucket.playerCount;
  }
  if (requiredCount > bucket.playerCount) {
    return `Bucket requires ${String(requiredCount)} roles but only has ${String(bucket.playerCount)} player slots`;
  }
  if (maxCapacity < bucket.playerCount) {
    return `Bucket can fill at most ${String(maxCapacity)} of ${String(bucket.playerCount)} player slots`;
  }
  return undefined;
}

/**
 * Validates that all role IDs in a set of buckets are known for the given game mode,
 * and that advanced bucket constraints are feasible.
 * Returns an error message, or undefined if all are valid.
 */
export function validateRoleBucketsForMode(
  buckets: RoleBucket[],
  gameMode: GameMode,
): string | undefined {
  const { roles } = getModeDefinition(gameMode);
  for (const bucket of buckets) {
    if (isSimpleRoleBucket(bucket)) {
      if (!(bucket.roleId in roles)) return `Unknown role: ${bucket.roleId}`;
    } else {
      for (const slot of bucket.roles) {
        if (!(slot.roleId in roles)) return `Unknown role: ${slot.roleId}`;
      }
      const feasibilityError = validateAdvancedBucketFeasibility(bucket);
      if (feasibilityError) return feasibilityError;
    }
  }
  return undefined;
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
