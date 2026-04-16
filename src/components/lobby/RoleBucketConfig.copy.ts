export const ROLE_BUCKET_CONFIG_COPY = {
  addBucket: "Add bucket",
  removeBucket: "Remove bucket",
  bucketNamePlaceholder: (index: number) => `Bucket ${String(index + 1)}`,
  playerCount: "Players",
  addRole: "Add role…",
  unique: "Unique",
  removeRole: "Remove",
  noRoles: "No roles added yet.",
} as const;
