import { describe, it, expect } from "vitest";
import { Team } from "@/lib/types";
import { WerewolfRole } from "../roles";
import { getTeamPhaseKey } from "./phase-keys";
import { buildNightPhaseOrder } from "./night-phase";

const assignments = [
  { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
  { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
  { playerId: "p3", roleDefinitionId: WerewolfRole.Mason },
  { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
];

describe("buildNightPhaseOrder", () => {
  it("includes EveryNight and FirstNightOnly roles on turn 1", () => {
    const order = buildNightPhaseOrder(1, assignments);
    expect(order).toContain(getTeamPhaseKey(Team.Bad));
    expect(order).toContain(WerewolfRole.Seer);
    expect(order).toContain(WerewolfRole.Mason);
  });

  it("excludes FirstNightOnly roles on turn 2+", () => {
    const order = buildNightPhaseOrder(2, assignments);
    expect(order).toContain(getTeamPhaseKey(Team.Bad));
    expect(order).toContain(WerewolfRole.Seer);
    expect(order).not.toContain(WerewolfRole.Mason);
  });

  it("excludes roles not present in roleAssignments", () => {
    const order = buildNightPhaseOrder(1, assignments);
    expect(order).not.toContain(WerewolfRole.Witch);
    expect(order).not.toContain(WerewolfRole.Spellcaster);
  });

  it("excludes Never-waking roles even if assigned", () => {
    const order = buildNightPhaseOrder(1, assignments);
    expect(order).not.toContain(WerewolfRole.Villager);
  });
});
