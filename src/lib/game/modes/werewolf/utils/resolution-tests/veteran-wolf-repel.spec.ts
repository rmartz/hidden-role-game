import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { resolveNightActions } from "../resolution";
import { findKilled } from "./helpers";

describe("resolveNightActions", () => {
  describe("Veteran — wolf repel", () => {
    const veteranAssignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
      { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
      { playerId: "doc1", roleDefinitionId: WerewolfRole.Doctor },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
    ];

    it("alerts and wolves attack: wolf player dies, Veteran survives", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: {
            votes: [{ playerId: "w1", targetPlayerId: "vet1" }],
            suggestedTargetId: "vet1",
          },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        veteranAssignments,
        [],
      );

      const vetEvent = findKilled(events, "vet1");
      expect(vetEvent).toBeUndefined();

      const wolfEvent = findKilled(events, "w1");
      expect(wolfEvent).toMatchObject({
        died: true,
        attackedBy: expect.arrayContaining([WerewolfRole.Veteran]),
      });

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        type: "veteran-counterkilled",
        counterkilledPlayerId: "w1",
        veteranPlayerId: "vet1",
        source: "wolf-repel",
      });
    });

    it("alerts, wolves attack, and Bodyguard visits: wolf dies, Bodyguard dies, Veteran survives", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: {
            votes: [{ playerId: "w1", targetPlayerId: "vet1" }],
            suggestedTargetId: "vet1",
          },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        veteranAssignments,
        [],
      );

      const vetEvent = findKilled(events, "vet1");
      expect(vetEvent).toBeUndefined();

      const wolfEvent = findKilled(events, "w1");
      expect(wolfEvent).toMatchObject({ died: true });

      const bgEvent = findKilled(events, "bg1");
      expect(bgEvent).toMatchObject({ died: true });

      const counterkilledEvents = events.filter(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvents).toHaveLength(2);
    });

    it("alerts but no one visits: no deaths", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Veteran]: { alerted: true },
        },
        veteranAssignments,
        [],
      );

      expect(events.filter((e) => e.type === "killed" && e.died)).toHaveLength(
        0,
      );
      expect(
        events.find((e) => e.type === "veteran-counterkilled"),
      ).toBeUndefined();
    });

    it("confirmed alert action: Veteran is alerted", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: {
            votes: [{ playerId: "w1", targetPlayerId: "vet1" }],
            suggestedTargetId: "vet1",
          },
          [WerewolfRole.Veteran]: { alerted: true, confirmed: true },
        },
        veteranAssignments,
        [],
      );

      const vetEvent = findKilled(events, "vet1");
      expect(vetEvent).toBeUndefined();

      const wolfEvent = findKilled(events, "w1");
      expect(wolfEvent).toMatchObject({ died: true });
    });
  });
});
