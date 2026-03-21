import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../roles";
import { resolveNightActions, SMITE_PHASE_KEY } from "./resolution";
import { assignments } from "./resolution.test-helpers";

describe("resolveNightActions", () => {
  describe("Smite", () => {
    it("smited player dies even with Bodyguard protection", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "p1" },
        },
        assignments,
        [],
        ["p1"],
      );
      const event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(event).toMatchObject({
        attackedBy: expect.arrayContaining([
          WerewolfRole.Werewolf,
          SMITE_PHASE_KEY,
        ]),
        died: true,
      });
    });

    it("creates an attack event with SMITE_PHASE_KEY as attacker", () => {
      const events = resolveNightActions({}, assignments, [], ["p1"]);
      const event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(event).toMatchObject({
        type: "killed",
        attackedBy: [SMITE_PHASE_KEY],
        protectedBy: [],
        died: true,
      });
    });

    it("player with both werewolf attack and smite: both appear in attackedBy, died=true", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
        },
        assignments,
        [],
        ["p1"],
      );
      const event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(event).toMatchObject({
        attackedBy: [WerewolfRole.Werewolf, SMITE_PHASE_KEY],
        died: true,
      });
    });

    it("smite-only player (no role attacks): dies with attackedBy=[SMITE_PHASE_KEY]", () => {
      const events = resolveNightActions({}, assignments, [], ["p2"]);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: "killed",
        targetPlayerId: "p2",
        attackedBy: [SMITE_PHASE_KEY],
        protectedBy: [],
        died: true,
      });
    });
  });

  describe("Spellcaster", () => {
    it("emits a silenced event for the targeted player", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Spellcaster]: { targetPlayerId: "p1" } },
        assignments,
        [],
      );
      expect(events).toContainEqual({
        type: "silenced",
        targetPlayerId: "p1",
      });
    });

    it("does not emit combat events for a silenced player", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Spellcaster]: { targetPlayerId: "p1" } },
        assignments,
        [],
      );
      expect(events.filter((e) => e.type === "killed")).toHaveLength(0);
    });

    it("emits no events when Spellcaster takes no action", () => {
      const events = resolveNightActions({}, assignments, []);
      expect(events.filter((e) => e.type === "silenced")).toHaveLength(0);
    });
  });
});
