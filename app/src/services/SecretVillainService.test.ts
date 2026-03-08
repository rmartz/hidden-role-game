import { describe, it, expect } from "vitest";
import { secretVillainService } from "./SecretVillainService";

describe("SecretVillainService.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (5)", () => {
    const slots = secretVillainService.defaultRoleCount(5);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts["special-bad"]).toBe(1);
    expect(counts["bad"]).toBe(1);
    expect(counts["good"]).toBe(3);
    expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(5);
  });

  it("returns correct counts for 10 players", () => {
    const slots = secretVillainService.defaultRoleCount(10);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts["special-bad"]).toBe(1);
    expect(counts["bad"]).toBe(3);
    expect(counts["good"]).toBe(6);
    expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(10);
  });

  it("total slot count always equals numPlayers", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = secretVillainService.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(n);
    }
  });

  it("always has exactly 1 special-bad role", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = secretVillainService.defaultRoleCount(n);
      const specialBad = slots.find((s) => s.roleId === "special-bad");
      expect(specialBad?.count).toBe(1);
    }
  });
});
