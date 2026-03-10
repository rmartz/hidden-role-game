import { describe, it, expect } from "vitest";
import { AvalonRole } from "./roles";
import { AVALON_CONFIG } from "./config";

describe("AVALON_CONFIG.defaultRoleCount", () => {
  it("total slot count always equals numPlayers", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = AVALON_CONFIG.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(n);
    }
  });

  it("always has exactly 1 special-good role", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = AVALON_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));
      expect(counts[AvalonRole.SpecialGood]).toBe(1);
    }
  });

  it("bad count is approximately half of players", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = AVALON_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));
      expect(counts[AvalonRole.Bad]).toBe(Math.floor((n - 1) / 2));
    }
  });
});
