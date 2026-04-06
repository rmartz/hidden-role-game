import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { resolveNightActions } from "../resolution";

describe("resolveNightActions", () => {
  describe("Altruist", () => {
    const altruistAssignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "alt1", roleDefinitionId: WerewolfRole.Altruist },
      { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
    ];

    it("intercept redirects attack: original target survives, Altruist dies", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Altruist]: { targetPlayerId: "p1" },
        },
        altruistAssignments,
        [],
      );
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toBeUndefined();

      const altEvent = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "alt1",
      );
      expect(altEvent).toMatchObject({ died: true });

      const interceptEvent = events.find(
        (e) => e.type === "altruist-intercepted",
      );
      expect(interceptEvent).toMatchObject({
        type: "altruist-intercepted",
        altruistPlayerId: "alt1",
        savedPlayerId: "p1",
      });
    });

    it("skip leaves original kill unaffected", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Altruist]: { skipped: true },
        },
        altruistAssignments,
        [],
      );
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toMatchObject({ died: true });
      expect(
        events.find((e) => e.type === "altruist-intercepted"),
      ).toBeUndefined();
    });

    it("intercept ignored when Altruist is themselves under attack", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "alt1" },
          [WerewolfRole.Altruist]: { targetPlayerId: "p1" },
        },
        altruistAssignments,
        [],
      );
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toBeUndefined();

      const altEvent = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "alt1",
      );
      expect(altEvent).toMatchObject({ died: true });
      expect(
        events.find((e) => e.type === "altruist-intercepted"),
      ).toBeUndefined();
    });

    it("intercept ignored when target is already protected", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "p1" },
          [WerewolfRole.Altruist]: { targetPlayerId: "p1" },
        },
        altruistAssignments,
        [],
      );
      const altEvent = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "alt1",
      );
      expect(altEvent).toBeUndefined();
      expect(
        events.find((e) => e.type === "altruist-intercepted"),
      ).toBeUndefined();
    });

    it("intercept ignored when targeted player is not under attack", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Altruist]: { targetPlayerId: "p2" },
        },
        altruistAssignments,
        [],
      );
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toMatchObject({ died: true });
      expect(
        events.find((e) => e.type === "altruist-intercepted"),
      ).toBeUndefined();
    });

    it("intercept ignored when Witch has already protected the target", () => {
      const assignmentsWithWitch = [
        ...altruistAssignments,
        { playerId: "witch1", roleDefinitionId: WerewolfRole.Witch },
      ];
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Witch]: { targetPlayerId: "p1" },
          [WerewolfRole.Altruist]: { targetPlayerId: "p1" },
        },
        assignmentsWithWitch,
        [],
      );
      const altEvent = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "alt1",
      );
      expect(altEvent).toBeUndefined();
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toMatchObject({ died: false });
      expect(
        events.find((e) => e.type === "altruist-intercepted"),
      ).toBeUndefined();
    });

    it("intercept ignored when Altruist targets themselves", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Altruist]: { targetPlayerId: "alt1" },
        },
        altruistAssignments,
        [],
      );
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toMatchObject({ died: true });
      expect(
        events.find((e) => e.type === "altruist-intercepted"),
      ).toBeUndefined();
    });
  });
});
