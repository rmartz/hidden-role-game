import { describe, it, expect } from "vitest";
import { WEREWOLF_CONFIG, WerewolfRole } from "./werewolf";

describe("WEREWOLF_CONFIG.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (5)", () => {
    const slots = WEREWOLF_CONFIG.defaultRoleCount(5);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts[WerewolfRole.Bad]).toBe(1);
    expect(counts[WerewolfRole.Good]).toBe(4);
  });

  it("returns correct counts for 10 players", () => {
    const slots = WEREWOLF_CONFIG.defaultRoleCount(10);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts[WerewolfRole.Bad]).toBe(3);
    expect(counts[WerewolfRole.Good]).toBe(7);
  });

  it("total slot count always equals numPlayers", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(n);
    }
  });

  it("bad count is approximately one third of players", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));
      expect(counts[WerewolfRole.Bad]).toBe(Math.floor(n / 3));
    }
  });
});
