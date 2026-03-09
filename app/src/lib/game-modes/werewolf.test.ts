import { describe, it, expect } from "vitest";
import { Team } from "@/lib/models";
import { WEREWOLF_CONFIG, WEREWOLF_ROLES, WerewolfRole } from "./werewolf";

describe("WEREWOLF_CONFIG.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (5)", () => {
    const slots = WEREWOLF_CONFIG.defaultRoleCount(5);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts[WerewolfRole.Werewolf]).toBe(1);
    expect(counts[WerewolfRole.Villager]).toBe(4);
  });

  it("returns correct counts for 10 players", () => {
    const slots = WEREWOLF_CONFIG.defaultRoleCount(10);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts[WerewolfRole.Werewolf]).toBe(3);
    expect(counts[WerewolfRole.Villager]).toBe(7);
  });

  it("total slot count always equals numPlayers", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(n);
    }
  });

  it("werewolf count is approximately one third of players", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = WEREWOLF_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));
      expect(counts[WerewolfRole.Werewolf]).toBe(Math.floor(n / 3));
    }
  });
});

describe("WEREWOLF_ROLES", () => {
  it("all roles have correct team assignments", () => {
    expect(WEREWOLF_ROLES[WerewolfRole.Villager].team).toBe(Team.Good);
    expect(WEREWOLF_ROLES[WerewolfRole.Werewolf].team).toBe(Team.Bad);
    expect(WEREWOLF_ROLES[WerewolfRole.Seer].team).toBe(Team.Good);
    expect(WEREWOLF_ROLES[WerewolfRole.Witch].team).toBe(Team.Good);
    expect(WEREWOLF_ROLES[WerewolfRole.Spellcaster].team).toBe(Team.Good);
    expect(WEREWOLF_ROLES[WerewolfRole.Mason].team).toBe(Team.Good);
    expect(WEREWOLF_ROLES[WerewolfRole.Chupacabra].team).toBe(Team.Neutral);
    expect(WEREWOLF_ROLES[WerewolfRole.VillageIdiot].team).toBe(Team.Good);
    expect(WEREWOLF_ROLES[WerewolfRole.Bodyguard].team).toBe(Team.Good);
  });

  it("night-waking roles are correctly configured", () => {
    expect(WEREWOLF_ROLES[WerewolfRole.Werewolf].wakesAtNight).toBe(true);
    expect(WEREWOLF_ROLES[WerewolfRole.Seer].wakesAtNight).toBe(true);
    expect(WEREWOLF_ROLES[WerewolfRole.Witch].wakesAtNight).toBe(true);
    expect(WEREWOLF_ROLES[WerewolfRole.Spellcaster].wakesAtNight).toBe(true);
    expect(WEREWOLF_ROLES[WerewolfRole.Bodyguard].wakesAtNight).toBe(true);
    expect(WEREWOLF_ROLES[WerewolfRole.Chupacabra].wakesAtNight).toBe(true);
    expect(WEREWOLF_ROLES[WerewolfRole.Mason].wakesAtNight).toBe(
      "first-night-only",
    );
    expect(WEREWOLF_ROLES[WerewolfRole.Villager].wakesAtNight).toBe(false);
    expect(WEREWOLF_ROLES[WerewolfRole.VillageIdiot].wakesAtNight).toBe(false);
  });

  it("Werewolves can see their own team", () => {
    expect(WEREWOLF_ROLES[WerewolfRole.Werewolf].canSeeTeam).toContain(
      Team.Bad,
    );
  });
});
