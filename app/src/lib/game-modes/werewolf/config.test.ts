import { describe, it, expect } from "vitest";
import { WerewolfRole } from "./roles";
import { WEREWOLF_CONFIG } from "./config";

describe("WEREWOLF_CONFIG.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (5)", () => {
    const slots = WEREWOLF_CONFIG.defaultRoleCount(5);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));

    // 4 role-receiving players (narrator excluded): 1 werewolf, 2 villagers, 1 seer
    expect(counts[WerewolfRole.Werewolf]).toBe(1);
    expect(counts[WerewolfRole.Villager]).toBe(2);
    expect(counts[WerewolfRole.Seer]).toBe(1);
  });

  it("returns correct counts for 10 players", () => {
    const slots = WEREWOLF_CONFIG.defaultRoleCount(10);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));

    // 9 role-receiving players (narrator excluded): 3 werewolves, 5 villagers, 1 seer
    expect(counts[WerewolfRole.Werewolf]).toBe(3);
    expect(counts[WerewolfRole.Villager]).toBe(5);
    expect(counts[WerewolfRole.Seer]).toBe(1);
  });

  it("total slot count always equals numPlayers minus one (narrator excluded)", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.min, 0)).toBe(n - 1);
    }
  });

  it("werewolf count is approximately one third of non-narrator players", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
      expect(counts[WerewolfRole.Werewolf]).toBe(Math.floor((n - 1) / 3));
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
