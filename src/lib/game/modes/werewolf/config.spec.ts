import { describe, it, expect } from "vitest";
import type { RoleBucket } from "@/lib/types";
import { WerewolfRole, MIN_PLAYERS } from "./roles";
import { WEREWOLF_CONFIG } from "./config";

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

describe("WEREWOLF_CONFIG.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (7)", () => {
    const buckets = WEREWOLF_CONFIG.defaultRoleCount(7);
    const counts = bucketCounts(buckets);

    // 6 role-receiving players: 1 werewolf, 4 villagers, 1 seer
    expect(counts[WerewolfRole.Werewolf]).toBe(1);
    expect(counts[WerewolfRole.Villager]).toBe(4);
    expect(counts[WerewolfRole.Seer]).toBe(1);
  });

  it("6-8 role-players get 1 werewolf", () => {
    for (const total of [7, 8, 9]) {
      const buckets = WEREWOLF_CONFIG.defaultRoleCount(total);
      const counts = bucketCounts(buckets);
      expect(counts[WerewolfRole.Werewolf]).toBe(1);
    }
  });

  it("9-11 role-players get 2 werewolves", () => {
    for (const total of [10, 11, 12]) {
      const buckets = WEREWOLF_CONFIG.defaultRoleCount(total);
      const counts = bucketCounts(buckets);
      expect(counts[WerewolfRole.Werewolf]).toBe(2);
    }
  });

  it("12-14 role-players get 3 werewolves", () => {
    for (const total of [13, 14, 15]) {
      const buckets = WEREWOLF_CONFIG.defaultRoleCount(total);
      const counts = bucketCounts(buckets);
      expect(counts[WerewolfRole.Werewolf]).toBe(3);
    }
  });

  it("total player count always equals numPlayers minus one (narrator excluded)", () => {
    for (let n = MIN_PLAYERS; n <= 16; n++) {
      const buckets = WEREWOLF_CONFIG.defaultRoleCount(n);
      expect(buckets.reduce((sum, b) => sum + b.playerCount, 0)).toBe(n - 1);
    }
  });

  it("always includes exactly 1 seer", () => {
    for (let n = MIN_PLAYERS; n <= 16; n++) {
      const buckets = WEREWOLF_CONFIG.defaultRoleCount(n);
      const counts = bucketCounts(buckets);
      expect(counts[WerewolfRole.Seer]).toBe(1);
    }
  });
});

describe("WEREWOLF_CONFIG.isValidRoleCount", () => {
  it("returns true when total roles equals numPlayers minus one (narrator)", () => {
    const roleCounts = {
      [WerewolfRole.Werewolf]: 2,
      [WerewolfRole.Villager]: 4,
      [WerewolfRole.Seer]: 1,
    };
    expect(WEREWOLF_CONFIG.isValidRoleCount(8, roleCounts)).toBe(true);
  });

  it("returns false when total roles equals numPlayers (no narrator slot)", () => {
    const roleCounts = {
      [WerewolfRole.Werewolf]: 2,
      [WerewolfRole.Villager]: 4,
      [WerewolfRole.Seer]: 1,
    };
    expect(WEREWOLF_CONFIG.isValidRoleCount(7, roleCounts)).toBe(false);
  });
});
