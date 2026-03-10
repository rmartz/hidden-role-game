import { describe, it, expect } from "vitest";
import { AvalonRole } from "./roles";
import { AVALON_CONFIG } from "./config";

describe("AVALON_CONFIG.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (5)", () => {
    const slots = AVALON_CONFIG.defaultRoleCount(5);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));

    expect(counts[AvalonRole.Bad]).toBe(2);
    expect(counts[AvalonRole.SpecialGood]).toBe(1);
    expect(counts[AvalonRole.Good]).toBe(2);
  });

  it("returns correct counts for 10 players", () => {
    const slots = AVALON_CONFIG.defaultRoleCount(10);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));

    expect(counts[AvalonRole.Bad]).toBe(4);
    expect(counts[AvalonRole.SpecialGood]).toBe(1);
    expect(counts[AvalonRole.Good]).toBe(5);
  });

  it("total slot count always equals numPlayers", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = AVALON_CONFIG.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.min, 0)).toBe(n);
    }
  });

  it("always has exactly 1 special-good role", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = AVALON_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
      expect(counts[AvalonRole.SpecialGood]).toBe(1);
    }
  });

  it("bad count is approximately half of players", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = AVALON_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
      expect(counts[AvalonRole.Bad]).toBe(Math.floor((n - 1) / 2));
    }
  });
});
