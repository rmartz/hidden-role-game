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

    it("alerts and Bodyguard visits: Bodyguard dies, Veteran survives unprotected", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Bodyguard]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
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
        source: "visitor",
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

    it("alerts and Doctor visits: Doctor dies", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Doctor]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
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
        source: "visitor",
      });
    });

    it("alerts and Vigilante targets Veteran: Vigilante dies", () => {
      const vigilanteAssignments = [
        { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
        { playerId: "vig1", roleDefinitionId: WerewolfRole.Vigilante },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      ];

      const events = resolveNightActions(
        {
          [WerewolfRole.Vigilante]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        vigilanteAssignments,
        [],
      );

      const vigEvent = findKilled(events, "vig1");
      expect(vigEvent).toMatchObject({
        died: true,
        attackedBy: expect.arrayContaining([WerewolfRole.Veteran]),
      });

      const vetEvent = findKilled(events, "vet1");
      expect(vetEvent).toBeUndefined();

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        counterkilledPlayerId: "vig1",
        veteranPlayerId: "vet1",
        source: "visitor",
      });
    });

    it("alerts and Seer investigates Veteran: Seer is NOT counter-killed", () => {
      const seerAssignments = [
        { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
        { playerId: "s1", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      ];

      const events = resolveNightActions(
        {
          [WerewolfRole.Seer]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        seerAssignments,
        [],
      );

      const seerEvent = findKilled(events, "s1");
      expect(seerEvent).toBeUndefined();

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

    it("alerts and a first-hit Tough Guy visits: counter-kill absorbed, died is false", () => {
      const toughGuyVisitorAssignments = [
        { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
        { playerId: "tg1", roleDefinitionId: WerewolfRole.ToughGuy },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      ];

      const events = resolveNightActions(
        {
          [WerewolfRole.ToughGuy]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        toughGuyVisitorAssignments,
        [],
      );

      const tgKilled = findKilled(events, "tg1");
      expect(tgKilled).toMatchObject({
        died: false,
        attackedBy: expect.arrayContaining([WerewolfRole.Veteran]),
      });

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        type: "veteran-counterkilled",
        counterkilledPlayerId: "tg1",
        veteranPlayerId: "vet1",
        source: "visitor",
        died: false,
      });
    });

    it("Altruist intercepts a wolf attack on alerted Veteran: wolf NOT counter-killed, Altruist dies", () => {
      const altruistAssignments = [
        { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
        { playerId: "alt1", roleDefinitionId: WerewolfRole.Altruist },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      ];

      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: {
            votes: [{ playerId: "w1", targetPlayerId: "vet1" }],
            suggestedTargetId: "vet1",
          },
          [WerewolfRole.Altruist]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        altruistAssignments,
        [],
      );

      // Altruist intercepted the attack; the wolf is not counter-killed.
      const wolfKilled = findKilled(events, "w1");
      expect(wolfKilled).toBeUndefined();

      // Altruist took the wolf attack and died.
      const altKilled = findKilled(events, "alt1");
      expect(altKilled).toMatchObject({ died: true });

      // Veteran survives.
      const vetKilled = findKilled(events, "vet1");
      expect(vetKilled).toBeUndefined();

      // Altruist intercept event is emitted.
      const interceptEvent = events.find(
        (e) => e.type === "altruist-intercepted",
      );
      expect(interceptEvent).toMatchObject({
        type: "altruist-intercepted",
        altruistPlayerId: "alt1",
        savedPlayerId: "vet1",
      });

      // No veteran-counterkilled event for the wolf.
      expect(
        events.find(
          (e) =>
            e.type === "veteran-counterkilled" &&
            (e as { counterkilledPlayerId: string }).counterkilledPlayerId ===
              "w1",
        ),
      ).toBeUndefined();
    });

    it("alerts and Priest wards alerted Veteran: Priest is NOT counter-killed", () => {
      const priestAssignments = [
        { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
        { playerId: "pr1", roleDefinitionId: WerewolfRole.Priest },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      ];

      const events = resolveNightActions(
        {
          [WerewolfRole.Priest]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        priestAssignments,
        [],
        undefined,
        { priestWards: { vet1: "pr1" } },
      );

      const priestEvent = findKilled(events, "pr1");
      expect(priestEvent).toBeUndefined();

      expect(
        events.find((e) => e.type === "veteran-counterkilled"),
      ).toBeUndefined();
    });

    it("Altruist is counter-killed as a visitor when they target the alerted Veteran", () => {
      const altruistAssignments = [
        { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
        { playerId: "alt1", roleDefinitionId: WerewolfRole.Altruist },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      ];

      const events = resolveNightActions(
        {
          [WerewolfRole.Altruist]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        altruistAssignments,
        [],
      );

      // Altruist physically visits the Veteran and is counter-killed.
      const altKilled = findKilled(events, "alt1");
      expect(altKilled).toMatchObject({
        died: true,
        attackedBy: expect.arrayContaining([WerewolfRole.Veteran]),
      });

      // Veteran survives.
      const vetKilled = findKilled(events, "vet1");
      expect(vetKilled).toBeUndefined();

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        counterkilledPlayerId: "alt1",
        veteranPlayerId: "vet1",
        source: "visitor",
        died: true,
      });
    });
    it("alerts and Priest wards the Veteran: Priest is NOT counter-killed", () => {
      const priestAssignments = [
        { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
        { playerId: "priest1", roleDefinitionId: WerewolfRole.Priest },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      ];

      const events = resolveNightActions(
        {
          [WerewolfRole.Veteran]: { alerted: true },
        },
        priestAssignments,
        [],
        undefined,
        { priestWards: { vet1: "priest1" } },
      );

      const priestEvent = findKilled(events, "priest1");
      expect(priestEvent).toBeUndefined();

      expect(
        events.find((e) => e.type === "veteran-counterkilled"),
      ).toBeUndefined();
    });
  });
});
