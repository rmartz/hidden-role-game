import { describe, it, expect } from "vitest";
import { WerewolfRole } from "./roles";
import { WEREWOLF_CONFIG } from "./config";

describe("WEREWOLF_CONFIG.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (5)", () => {
    const slots = WEREWOLF_CONFIG.defaultRoleCount(5);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));

    expect(counts[WerewolfRole.Werewolf]).toBe(1);
    expect(counts[WerewolfRole.Villager]).toBe(3);
    expect(counts[WerewolfRole.Seer]).toBe(1);
  });

  it("returns correct counts for 10 players", () => {
    const slots = WEREWOLF_CONFIG.defaultRoleCount(10);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));

    expect(counts[WerewolfRole.Werewolf]).toBe(3);
    expect(counts[WerewolfRole.Villager]).toBe(6);
    expect(counts[WerewolfRole.Seer]).toBe(1);
  });

  it("total slot count always equals numPlayers", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.min, 0)).toBe(n);
    }
  });

  it("werewolf count is approximately one third of players", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
      expect(counts[WerewolfRole.Werewolf]).toBe(Math.floor(n / 3));
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
