import { describe, expect, it } from "vitest";

import { WerewolfRole } from "../../roles";
import { resolveNightActions } from "../resolution";
import { findKilled } from "./helpers";

describe("resolveNightActions", () => {
  describe("Veteran — exemptions and no-alert", () => {
    const veteranAssignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
      { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
      { playerId: "doc1", roleDefinitionId: WerewolfRole.Doctor },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
    ];

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

    it("alerts and Tough Guy has targetPlayerId pointing at Veteran: Tough Guy is NOT counter-killed (None category)", () => {
      // ToughGuy has targetCategory: None — it does not physically visit and
      // is therefore not a physical visitor from the Veteran's perspective.
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
      expect(tgKilled).toBeUndefined();

      expect(
        events.find((e) => e.type === "veteran-counterkilled"),
      ).toBeUndefined();
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

    it("alerts and Altruist targets the Veteran: Altruist is NOT counter-killed (Special category)", () => {
      // Altruist has targetCategory: Special — its interception mechanic is
      // not considered a physical visit, so it is not counter-killed.
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

      // Altruist is not counter-killed (Special category is not a physical visit).
      const altKilled = findKilled(events, "alt1");
      expect(altKilled).toBeUndefined();

      // Veteran survives.
      const vetKilled = findKilled(events, "vet1");
      expect(vetKilled).toBeUndefined();

      expect(
        events.find((e) => e.type === "veteran-counterkilled"),
      ).toBeUndefined();
    });
  });
});
