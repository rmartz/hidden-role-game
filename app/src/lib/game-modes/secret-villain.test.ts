import { describe, it, expect } from "vitest";
import { SECRET_VILLAIN_CONFIG, SecretVillainRole } from "./secret-villain";

describe("SECRET_VILLAIN_CONFIG.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (5)", () => {
    const slots = SECRET_VILLAIN_CONFIG.defaultRoleCount(5);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts[SecretVillainRole.SpecialBad]).toBe(1);
    expect(counts[SecretVillainRole.Bad]).toBe(1);
    expect(counts[SecretVillainRole.Good]).toBe(3);
  });

  it("returns correct counts for 10 players", () => {
    const slots = SECRET_VILLAIN_CONFIG.defaultRoleCount(10);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts[SecretVillainRole.SpecialBad]).toBe(1);
    expect(counts[SecretVillainRole.Bad]).toBe(3);
    expect(counts[SecretVillainRole.Good]).toBe(6);
  });

  it("total slot count always equals numPlayers", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = SECRET_VILLAIN_CONFIG.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(n);
    }
  });

  it("always has exactly 1 special-bad role", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = SECRET_VILLAIN_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));
      expect(counts[SecretVillainRole.SpecialBad]).toBe(1);
    }
  });

  it("bad count is approximately half of players minus the special bad", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = SECRET_VILLAIN_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));
      expect(counts[SecretVillainRole.Bad]).toBe(Math.floor((n - 1) / 2) - 1);
    }
  });
});
