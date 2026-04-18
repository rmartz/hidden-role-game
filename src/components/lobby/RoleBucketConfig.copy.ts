export const ROLE_BUCKET_CONFIG_COPY = {
  addBucket: "Add bucket",
  removeBucket: "Remove bucket",
  bucketNamePlaceholder: (index: number) => `Bucket ${String(index + 1)}`,
  playerCount: "Players",
  addRole: "Add role…",
  /** Badge shown on inherently unique roles (max 1 enforced, cannot be toggled). */
  uniqueBadge: "Unique",
  /** Bucket-level toggle — only shown when the bucket has non-unique roles. */
  bucketUnique: "Limit to one copy per role",
  removeRole: "Remove",
  noRoles: "No roles added yet.",
  /** Error shown when the total max draw capacity is less than the bucket's playerCount. */
  errorInsufficientCapacity: (maxCapacity: number, playerCount: number) =>
    `Not enough role capacity to fill this bucket (can fill at most ${String(maxCapacity)} of ${String(playerCount)})`,
} as const;
