/**
 * A single role entry within an advanced role bucket.
 * `max` is undefined for non-unique roles (can fill the whole bucket);
 * set to a number to cap how many copies can be drawn
 * (e.g. max: 1 means at most one copy drawn from this bucket).
 */
export interface RoleBucketSlot {
  roleId: string;
  max?: number;
}

/** A bucket that always assigns exactly `playerCount` copies of a single role. */
export interface SimpleRoleBucket {
  playerCount: number;
  roleId: string;
}

/**
 * A bucket with a multi-role pool that draws `playerCount` roles using
 * min/max constraints per slot. Used in Advanced mode.
 */
export interface AdvancedRoleBucket {
  playerCount: number;
  roles: RoleBucketSlot[];
  /** Optional display name shown in the config UI and post-game lobby. */
  name?: string;
}

export type RoleBucket = SimpleRoleBucket | AdvancedRoleBucket;

export function isSimpleRoleBucket(b: RoleBucket): b is SimpleRoleBucket {
  return "roleId" in b;
}
