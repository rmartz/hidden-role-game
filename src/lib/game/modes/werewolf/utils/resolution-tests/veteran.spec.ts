import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { resolveNightActions } from "../resolution";
import { findKilled } from "./helpers";

describe("resolveNightActions", () => {
  describe("Veteran", () => {
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
          [WerewolfRole.Veteran]: {},
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

    it("alerts and Bodyguard visits: Bodyguard dies, Veteran survives unprotected", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Bodyguard]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: {},
        },
        veteranAssignments,
        [],
      );

      const bgEvent = findKilled(events, "bg1");
      expect(bgEvent).toMatchObject({
        died: true,
        attackedBy: expect.arrayContaining([WerewolfRole.Veteran]),
      });

      const vetEvent = findKilled(events, "vet1");
      expect(vetEvent).toBeUndefined();

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        type: "veteran-counterkilled",
        counterkilledPlayerId: "bg1",
        veteranPlayerId: "vet1",
        source: "protector-visit",
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
          [WerewolfRole.Veteran]: {},
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

    it("does not alert: wolves kill them normally", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: {
            votes: [{ playerId: "w1", targetPlayerId: "vet1" }],
            suggestedTargetId: "vet1",
          },
        },
        veteranAssignments,
        [],
      );

      const vetEvent = findKilled(events, "vet1");
      expect(vetEvent).toMatchObject({ died: true });

      expect(
        events.find((e) => e.type === "veteran-counterkilled"),
      ).toBeUndefined();
    });

    it("does not alert (skipped): Bodyguard protects normally", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: {
            votes: [{ playerId: "w1", targetPlayerId: "vet1" }],
            suggestedTargetId: "vet1",
          },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { skipped: true },
        },
        veteranAssignments,
        [],
      );

      const vetEvent = findKilled(events, "vet1");
      expect(vetEvent).toMatchObject({ died: false });

      const bgEvent = findKilled(events, "bg1");
      expect(bgEvent).toBeUndefined();

      expect(
        events.find((e) => e.type === "veteran-counterkilled"),
      ).toBeUndefined();
    });

    it("alerts but no one visits: no deaths", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Veteran]: {},
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

    it("alerts and Doctor visits: Doctor dies", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Doctor]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: {},
        },
        veteranAssignments,
        [],
      );

      const docEvent = findKilled(events, "doc1");
      expect(docEvent).toMatchObject({ died: true });

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        counterkilledPlayerId: "doc1",
        source: "protector-visit",
      });
    });

    it("confirmed alert action: Veteran is alerted", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: {
            votes: [{ playerId: "w1", targetPlayerId: "vet1" }],
            suggestedTargetId: "vet1",
          },
          [WerewolfRole.Veteran]: { confirmed: true },
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
