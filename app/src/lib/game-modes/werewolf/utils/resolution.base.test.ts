import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../roles";
import { resolveNightActions } from "./resolution";
import { findKilled, assignments } from "./resolution.test-helpers";

describe("resolveNightActions", () => {
  it("marks an attacked player as died", () => {
    const events = resolveNightActions(
      { [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" } },
      assignments,
      [],
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      targetPlayerId: "p1",
      attackedBy: [WerewolfRole.Werewolf],
      protectedBy: [],
      died: true,
    });
  });

  it("marks a protected player as survived when attacked", () => {
    const events = resolveNightActions(
      {
        [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
        [WerewolfRole.Bodyguard]: { targetPlayerId: "p1" },
      },
      assignments,
      [],
    );
    const event = events.find(
      (e) => e.type === "killed" && e.targetPlayerId === "p1",
    );
    expect(event).toMatchObject({
      attackedBy: [WerewolfRole.Werewolf],
      protectedBy: [WerewolfRole.Bodyguard],
      died: false,
    });
  });

  it("does not include a player only protected (no attack)", () => {
    const events = resolveNightActions(
      { [WerewolfRole.Bodyguard]: { targetPlayerId: "p1" } },
      assignments,
      [],
    );
    expect(events).toHaveLength(0);
  });

  it("skips team actions with no suggestedTargetId", () => {
    const events = resolveNightActions(
      { [WerewolfRole.Werewolf]: { votes: [] } },
      assignments,
      [],
    );
    expect(events).toHaveLength(0);
  });

  it("Chupacabra attack applies when target is on Team.Bad", () => {
    const events = resolveNightActions(
      { [WerewolfRole.Chupacabra]: { targetPlayerId: "w1" } },
      assignments,
      [],
    );
    const e = findKilled(events, "w1");
    expect(e?.died).toBe(true);
  });

  it("Chupacabra attack does not apply when target is not on Team.Bad and werewolves are alive", () => {
    const events = resolveNightActions(
      { [WerewolfRole.Chupacabra]: { targetPlayerId: "p1" } },
      assignments,
      [],
    );
    expect(events).toHaveLength(0);
  });

  it("Chupacabra attack applies when all Team.Bad players are dead", () => {
    const events = resolveNightActions(
      { [WerewolfRole.Chupacabra]: { targetPlayerId: "p1" } },
      assignments,
      ["w1"],
    );
    const e = findKilled(events, "p1");
    expect(e?.died).toBe(true);
  });

  it("returns empty array when no night actions set", () => {
    const events = resolveNightActions({}, assignments, []);
    expect(events).toHaveLength(0);
  });

  describe("Witch", () => {
    it("protects an attacked player when Witch targets them", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Witch]: { targetPlayerId: "p1" },
        },
        assignments,
        [],
      );
      const event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(event).toMatchObject({
        protectedBy: [WerewolfRole.Witch],
        died: false,
      });
    });

    it("attacks an unattacked player when Witch targets them", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Witch]: { targetPlayerId: "p2" },
        },
        assignments,
        [],
      );
      const event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p2",
      );
      expect(event).toMatchObject({
        attackedBy: [WerewolfRole.Witch],
        protectedBy: [],
        died: true,
      });
    });

    it("has no effect when Witch takes no action", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" } },
        assignments,
        [],
      );
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: "killed",
        targetPlayerId: "p1",
      });
    });
  });
});
