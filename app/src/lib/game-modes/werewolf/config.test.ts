import { describe, it, expect } from "vitest";
import { WerewolfRole, MIN_PLAYERS } from "./roles";
import { WEREWOLF_CONFIG } from "./config";

describe("WEREWOLF_CONFIG.defaultRoleCount", () => {
  it("minimum player count is 7 (6 role-players + narrator)", () => {
    expect(MIN_PLAYERS).toBe(7);
  });

  it("returns correct counts for minimum player count (7)", () => {
    const slots = WEREWOLF_CONFIG.defaultRoleCount(7);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));

    // 6 role-receiving players: 1 werewolf, 4 villagers, 1 seer
    expect(counts[WerewolfRole.Werewolf]).toBe(1);
    expect(counts[WerewolfRole.Villager]).toBe(4);
    expect(counts[WerewolfRole.Seer]).toBe(1);
  });

  it("6-8 role-players get 1 werewolf", () => {
    for (const total of [7, 8, 9]) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(total);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
      expect(counts[WerewolfRole.Werewolf]).toBe(1);
    }
  });

  it("9-11 role-players get 2 werewolves", () => {
    for (const total of [10, 11, 12]) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(total);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
      expect(counts[WerewolfRole.Werewolf]).toBe(2);
    }
  });

  it("12-14 role-players get 3 werewolves", () => {
    for (const total of [13, 14, 15]) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(total);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
      expect(counts[WerewolfRole.Werewolf]).toBe(3);
    }
  });

  it("total slot count always equals numPlayers minus one (narrator excluded)", () => {
    for (let n = MIN_PLAYERS; n <= 16; n++) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.min, 0)).toBe(n - 1);
    }
  });

  it("always includes exactly 1 seer", () => {
    for (let n = MIN_PLAYERS; n <= 16; n++) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
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
