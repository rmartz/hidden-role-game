import { describe, it, expect } from "vitest";
import { AVALON_CONFIG } from "@/lib/game-modes/avalon";

describe("AVALON_CONFIG.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (5)", () => {
    const slots = AVALON_CONFIG.defaultRoleCount(5);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts["avalon-bad"]).toBe(2);
    expect(counts["avalon-special-good"]).toBe(1);
    expect(counts["avalon-good"]).toBe(2);
    expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(5);
  });

  it("returns correct counts for 10 players", () => {
    const slots = AVALON_CONFIG.defaultRoleCount(10);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts["avalon-bad"]).toBe(4);
    expect(counts["avalon-special-good"]).toBe(1);
    expect(counts["avalon-good"]).toBe(5);
    expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(10);
  });

  it("total slot count always equals numPlayers", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = AVALON_CONFIG.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(n);
    }
  });

  it("always has exactly 1 special-good role", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = AVALON_CONFIG.defaultRoleCount(n);
      const specialGood = slots.find((s) => s.roleId === "avalon-special-good");
      expect(specialGood?.count).toBe(1);
    }
  });
});
