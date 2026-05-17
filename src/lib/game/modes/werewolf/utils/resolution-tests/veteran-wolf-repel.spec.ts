import { describe, expect, it } from "vitest";

import { WerewolfRole } from "../../roles";
import { VeteranCounterkillSource } from "../../types";
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
        source: VeteranCounterkillSource.WolfRepel,
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

    it("alerts, wolves attack, Doctor protects counter-killed wolf: died is false on both events", () => {
      // The wolf is counter-killed by the Veteran, but the Doctor protects the
      // wolf, so the counter-kill is absorbed. Both the killed event and the
      // veteran-counterkilled event should have died: false.
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: {
            votes: [{ playerId: "w1", targetPlayerId: "vet1" }],
            suggestedTargetId: "vet1",
          },
          [WerewolfRole.Doctor]: { targetPlayerId: "w1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        veteranAssignments,
        [],
      );

      const vetEvent = findKilled(events, "vet1");
      expect(vetEvent).toBeUndefined();

      const wolfKilled = findKilled(events, "w1");
      expect(wolfKilled).toMatchObject({ died: false });

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        counterkilledPlayerId: "w1",
        veteranPlayerId: "vet1",
        source: VeteranCounterkillSource.WolfRepel,
        died: false,
      });
    });
    it("alerts, wolves attack, Priest ward covers counter-killed wolf: wolf survives", () => {
      // The Veteran counter-kills the wolf, but the wolf has an active Priest ward.
      // The ward should absorb the counter-kill attack (died: false on both events).
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
        undefined,
        { priestWards: { w1: "priest1" } },
      );

      const vetEvent = findKilled(events, "vet1");
      expect(vetEvent).toBeUndefined();

      const wolfKilled = findKilled(events, "w1");
      expect(wolfKilled).toMatchObject({ died: false });

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        counterkilledPlayerId: "w1",
        veteranPlayerId: "vet1",
        source: VeteranCounterkillSource.WolfRepel,
        died: false,
      });
    });

    it("Swapper redirects wolf attack onto alerted Veteran: wolf is counter-killed, Veteran survives", () => {
      // The wolves target p1, but Swapper swaps p1 and vet1, so the wolf attack
      // ends up on the Veteran. Since Veteran resolution runs after Swapper,
      // the post-swap attacks map is used — the wolf is counter-killed correctly.
      const swapperAssignments = [
        { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
        { playerId: "swap1", roleDefinitionId: WerewolfRole.Swapper },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      ];

      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: {
            votes: [{ playerId: "w1", targetPlayerId: "p1" }],
            suggestedTargetId: "p1",
          },
          // Swapper swaps p1 and vet1, so the wolf attack moves to vet1.
          [WerewolfRole.Swapper]: {
            targetPlayerId: "p1",
            secondTargetPlayerId: "vet1",
          },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        swapperAssignments,
        [],
      );

      // Veteran was targeted via Swapper and is alerted — wolf counter-killed.
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
        source: VeteranCounterkillSource.WolfRepel,
      });

      // p1 is not killed (attack was swapped away).
      const p1Event = findKilled(events, "p1");
      expect(p1Event).toBeUndefined();
    });
  });
});
