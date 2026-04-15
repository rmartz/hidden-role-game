import type { ModeConfig, RoleBucket, GameMode } from "@/lib/types";
import { isSimpleRoleBucket } from "@/lib/types";
import { getModeDefinition } from "@/lib/game/state";
import { getRoleSlotsRequired } from "@/lib/game/modes";

/**
 * Validates that all role IDs in a set of buckets are known for the given game mode.
 * Returns an error message for the first unknown role, or undefined if all are valid.
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
