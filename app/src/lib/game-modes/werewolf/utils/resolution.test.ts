import { describe, it, expect } from "vitest";
import { Team } from "@/lib/types";
import { WerewolfRole } from "../roles";
import { getTeamPhaseKey } from "./phase-keys";
import { resolveNightActions } from "./resolution";

const assignments = [
  { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
  { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
  { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "chup1", roleDefinitionId: WerewolfRole.Chupacabra },
];

describe("resolveNightActions", () => {
  it("marks an attacked player as died", () => {
    const result = resolveNightActions(
      { [getTeamPhaseKey(Team.Bad)]: { votes: [], suggestedTargetId: "p1" } },
      assignments,
      [],
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      targetPlayerId: "p1",
      attackedBy: [getTeamPhaseKey(Team.Bad)],
      protectedBy: [],
      died: true,
    });
  });

  it("marks a protected player as survived when attacked", () => {
    const result = resolveNightActions(
      {
        [getTeamPhaseKey(Team.Bad)]: { votes: [], suggestedTargetId: "p1" },
        [WerewolfRole.Bodyguard]: { targetPlayerId: "p1" },
      },
      assignments,
      [],
    );
    const event = result.find((e) => e.targetPlayerId === "p1");
    expect(event).toMatchObject({
      attackedBy: [getTeamPhaseKey(Team.Bad)],
      protectedBy: [WerewolfRole.Bodyguard],
      died: false,
    });
  });

  it("does not include a player only protected (no attack)", () => {
    const result = resolveNightActions(
      { [WerewolfRole.Bodyguard]: { targetPlayerId: "p1" } },
      assignments,
      [],
    );
    expect(result).toHaveLength(0);
  });

  it("skips team actions with no suggestedTargetId", () => {
    const result = resolveNightActions(
      { [getTeamPhaseKey(Team.Bad)]: { votes: [] } },
      assignments,
      [],
    );
    expect(result).toHaveLength(0);
  });

  it("Chupacabra attack applies when target is on Team.Bad", () => {
    const result = resolveNightActions(
      { [WerewolfRole.Chupacabra]: { targetPlayerId: "w1" } },
      assignments,
      [],
    );
    expect(result.find((e) => e.targetPlayerId === "w1")?.died).toBe(true);
  });

  it("Chupacabra attack does not apply when target is not on Team.Bad and werewolves are alive", () => {
    const result = resolveNightActions(
      { [WerewolfRole.Chupacabra]: { targetPlayerId: "p1" } },
      assignments,
      [],
    );
    expect(result).toHaveLength(0);
  });

  it("Chupacabra attack applies when all Team.Bad players are dead", () => {
    const result = resolveNightActions(
      { [WerewolfRole.Chupacabra]: { targetPlayerId: "p1" } },
      assignments,
      ["w1"], // w1 is the only werewolf and is dead
    );
    expect(result.find((e) => e.targetPlayerId === "p1")?.died).toBe(true);
  });

  it("returns empty array when no night actions set", () => {
    const result = resolveNightActions({}, assignments, []);
    expect(result).toHaveLength(0);
  });
});
