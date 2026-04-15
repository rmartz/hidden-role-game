import { describe, it, expect } from "vitest";
import type { RoleBucket } from "@/lib/types";
import { AvalonRole } from "./roles";
import { AVALON_CONFIG } from "./config";

/** Helper: convert single-role buckets to { roleId: playerCount } map */
function bucketCounts(buckets: RoleBucket[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of buckets) {
    const firstRole = b.roles[0];
    if (b.roles.length === 1 && firstRole) {
      counts[firstRole.roleId] =
        (counts[firstRole.roleId] ?? 0) + b.playerCount;
    }
  }
  return counts;
}

describe("AVALON_CONFIG.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (5)", () => {
    const buckets = AVALON_CONFIG.defaultRoleCount(5);
    const counts = bucketCounts(buckets);

    expect(counts[AvalonRole.MinionOfMordred]).toBe(2);
    expect(counts[AvalonRole.Merlin]).toBe(1);
    expect(counts[AvalonRole.LoyalServant]).toBe(2);
  });

  it("returns correct counts for 10 players", () => {
    const buckets = AVALON_CONFIG.defaultRoleCount(10);
    const counts = bucketCounts(buckets);

    expect(counts[AvalonRole.MinionOfMordred]).toBe(4);
    expect(counts[AvalonRole.Merlin]).toBe(1);
    expect(counts[AvalonRole.LoyalServant]).toBe(5);
  });

  it("total player count always equals numPlayers", () => {
    for (let n = 5; n <= 12; n++) {
      const buckets = AVALON_CONFIG.defaultRoleCount(n);
      expect(buckets.reduce((sum, b) => sum + b.playerCount, 0)).toBe(n);
    }
  });

  it("always has exactly 1 Merlin", () => {
    for (let n = 5; n <= 12; n++) {
      const buckets = AVALON_CONFIG.defaultRoleCount(n);
      const counts = bucketCounts(buckets);
      expect(counts[AvalonRole.Merlin]).toBe(1);
    }
  });

  it("evil count is approximately half of players", () => {
    for (let n = 5; n <= 12; n++) {
      const buckets = AVALON_CONFIG.defaultRoleCount(n);
      const counts = bucketCounts(buckets);
      expect(counts[AvalonRole.MinionOfMordred]).toBe(Math.floor((n - 1) / 2));
    }
  });
});
