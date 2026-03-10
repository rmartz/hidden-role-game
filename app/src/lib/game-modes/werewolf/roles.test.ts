import { describe, it, expect } from "vitest";
import { Team } from "@/lib/models";
import { WakesAtNight } from "./types";
import { WEREWOLF_ROLES, WerewolfRole } from "./roles";

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
    expect(WEREWOLF_ROLES[WerewolfRole.Werewolf].wakesAtNight).toBe(
      WakesAtNight.EveryNight,
    );
    expect(WEREWOLF_ROLES[WerewolfRole.Seer].wakesAtNight).toBe(
      WakesAtNight.EveryNight,
    );
    expect(WEREWOLF_ROLES[WerewolfRole.Witch].wakesAtNight).toBe(
      WakesAtNight.EveryNight,
    );
    expect(WEREWOLF_ROLES[WerewolfRole.Spellcaster].wakesAtNight).toBe(
      WakesAtNight.EveryNight,
    );
    expect(WEREWOLF_ROLES[WerewolfRole.Bodyguard].wakesAtNight).toBe(
      WakesAtNight.EveryNight,
    );
    expect(WEREWOLF_ROLES[WerewolfRole.Chupacabra].wakesAtNight).toBe(
      WakesAtNight.EveryNight,
    );
    expect(WEREWOLF_ROLES[WerewolfRole.Mason].wakesAtNight).toBe(
      WakesAtNight.FirstNightOnly,
    );
    expect(WEREWOLF_ROLES[WerewolfRole.Villager].wakesAtNight).toBe(
      WakesAtNight.Never,
    );
    expect(WEREWOLF_ROLES[WerewolfRole.VillageIdiot].wakesAtNight).toBe(
      WakesAtNight.Never,
    );
  });

  it("Werewolves can see their own team", () => {
    expect(WEREWOLF_ROLES[WerewolfRole.Werewolf].canSeeTeam).toContain(
      Team.Bad,
    );
  });

  it("Masons can see other Masons", () => {
    expect(WEREWOLF_ROLES[WerewolfRole.Mason].canSeeRole).toContain(
      WerewolfRole.Mason,
    );
  });
});
