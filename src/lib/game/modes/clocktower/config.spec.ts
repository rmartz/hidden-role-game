import { describe, it, expect } from "vitest";
import type { AdvancedRoleBucket } from "@/lib/types";
import {
  ClocktowerRole,
  defaultRoleCount,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from "./roles";

function advancedBuckets(numPlayers: number): AdvancedRoleBucket[] {
  return defaultRoleCount(numPlayers) as AdvancedRoleBucket[];
}

describe("defaultRoleCount", () => {
  it("returns correct distribution for minimum player count (5)", () => {
    const [townsfolk, outsiders, minions, demon] = advancedBuckets(5);
    expect(townsfolk?.playerCount).toBe(3);
    expect(outsiders?.playerCount).toBe(0);
    expect(minions?.playerCount).toBe(1);
    expect(demon?.playerCount).toBe(1);
  });

  it("returns correct distribution for maximum player count (15)", () => {
    const [townsfolk, outsiders, minions, demon] = advancedBuckets(15);
    expect(townsfolk?.playerCount).toBe(9);
    expect(outsiders?.playerCount).toBe(2);
    expect(minions?.playerCount).toBe(3);
    expect(demon?.playerCount).toBe(1);
  });

  it("bucket totals sum to numPlayers for all counts in 5–15 range", () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      const buckets = defaultRoleCount(n);
      const total = buckets.reduce((sum, b) => sum + b.playerCount, 0);
      expect(total, `total for ${n} players`).toBe(n);
    }
  });

  it("Demon bucket always has exactly max: 1 on the Imp slot", () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      const [, , , demonBucket] = advancedBuckets(n);
      const impSlot = demonBucket?.roles[0];
      expect(demonBucket?.roles).toHaveLength(1);
      expect(impSlot?.roleId).toBe(ClocktowerRole.Imp);
      expect(impSlot?.max, `Imp max for ${n} players`).toBe(1);
    }
  });

  it("clamps below minimum to 5-player distribution", () => {
    const buckets = advancedBuckets(1);
    const total = buckets.reduce((sum, b) => sum + b.playerCount, 0);
    expect(total).toBe(MIN_PLAYERS);
  });

  it("clamps above maximum to 15-player distribution", () => {
    const buckets = advancedBuckets(20);
    const total = buckets.reduce((sum, b) => sum + b.playerCount, 0);
    expect(total).toBe(MAX_PLAYERS);
  });

  it("all non-Demon slots have max: 1", () => {
    const [townsfolk, outsiders, minions] = advancedBuckets(15);
    for (const bucket of [townsfolk, outsiders, minions]) {
      for (const slot of bucket?.roles ?? []) {
        expect(slot.max, `max for slot ${slot.roleId}`).toBe(1);
      }
    }
  });
});
