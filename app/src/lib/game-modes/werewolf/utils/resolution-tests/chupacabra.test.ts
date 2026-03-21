import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { resolveNightActions } from "../resolution";

describe("resolveNightActions", () => {
  describe("Chupacabra", () => {
    const chupAssignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "minion1", roleDefinitionId: WerewolfRole.Minion },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "chup1", roleDefinitionId: WerewolfRole.Chupacabra },
    ];

    it("attack succeeds against a Werewolf", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Chupacabra]: { targetPlayerId: "w1" } },
        chupAssignments,
        [],
      );
      const killed = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "w1",
      );
      expect(killed).toBeDefined();
      expect(killed?.type === "killed" && killed.died).toBe(true);
    });

    it("attack fails against a non-werewolf when werewolves are alive", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Chupacabra]: { targetPlayerId: "minion1" } },
        chupAssignments,
        [],
      );
      expect(events.filter((e) => e.type === "killed")).toHaveLength(0);
    });

    it("attack succeeds against anyone once all werewolves are dead", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Chupacabra]: { targetPlayerId: "p1" } },
        chupAssignments,
        ["w1"],
      );
      const killed = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(killed).toBeDefined();
      expect(killed?.type === "killed" && killed.died).toBe(true);
    });

    it("attack fails against a non-werewolf when a werewolf is alive even if other Bad-team members are dead", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Chupacabra]: { targetPlayerId: "p1" } },
        chupAssignments,
        ["minion1"],
      );
      expect(events.filter((e) => e.type === "killed")).toHaveLength(0);
    });
  });
});
