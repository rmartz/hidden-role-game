import { describe, it, expect } from "vitest";
import {
  validateRoleBucketsForMode,
  validateRoleBucketsCoverPlayerCount,
} from "./role-slots";
import { GameMode } from "@/lib/types";
import type { RoleBucket } from "@/lib/types";
import { SecretVillainRole } from "@/lib/game/modes/secret-villain/roles";

describe("validateRoleBucketsCoverPlayerCount", () => {
  // SecretVillain has no custom roleSlotsRequired, so required == playerCount
  it("returns undefined when buckets exactly cover the player count", () => {
    const buckets: RoleBucket[] = [
      { playerCount: 5, roles: [{ roleId: "r", min: 1 }] },
    ];
    expect(
      validateRoleBucketsCoverPlayerCount(buckets, GameMode.SecretVillain, 5),
    ).toBeUndefined();
  });

  it("returns an error when total playerCount is less than required", () => {
    const buckets: RoleBucket[] = [
      { playerCount: 3, roles: [{ roleId: "r", min: 1 }] },
    ];
    expect(
      validateRoleBucketsCoverPlayerCount(buckets, GameMode.SecretVillain, 5),
    ).toBeDefined();
  });

  it("returns an error when total playerCount exceeds required", () => {
    const buckets: RoleBucket[] = [
      { playerCount: 6, roles: [{ roleId: "r", min: 1 }] },
    ];
    expect(
      validateRoleBucketsCoverPlayerCount(buckets, GameMode.SecretVillain, 5),
    ).toBeDefined();
  });

  it("returns undefined when multiple buckets sum to exact player count", () => {
    const buckets: RoleBucket[] = [
      { playerCount: 3, roles: [{ roleId: "good", min: 1 }] },
      { playerCount: 2, roles: [{ roleId: "bad", min: 1 }] },
    ];
    expect(
      validateRoleBucketsCoverPlayerCount(buckets, GameMode.SecretVillain, 5),
    ).toBeUndefined();
  });
});

describe("validateRoleBucketsForMode", () => {
  it("returns undefined when all role IDs are valid for the mode", () => {
    const buckets: RoleBucket[] = [
      {
        playerCount: 3,
        roles: [{ roleId: SecretVillainRole.Good, min: 1 }],
      },
      {
        playerCount: 1,
        roles: [{ roleId: SecretVillainRole.Bad, min: 1 }],
      },
      {
        playerCount: 1,
        roles: [{ roleId: SecretVillainRole.SpecialBad, min: 1 }],
      },
    ];
    expect(
      validateRoleBucketsForMode(buckets, GameMode.SecretVillain),
    ).toBeUndefined();
  });

  it("returns an error message naming the unknown role ID", () => {
    const buckets: RoleBucket[] = [
      {
        playerCount: 3,
        roles: [{ roleId: SecretVillainRole.Good, min: 1 }],
      },
      {
        playerCount: 1,
        roles: [{ roleId: "not-a-real-role", min: 1 }],
      },
    ];
    const error = validateRoleBucketsForMode(buckets, GameMode.SecretVillain);
    expect(error).toBeDefined();
    expect(error).toContain("not-a-real-role");
  });
});
