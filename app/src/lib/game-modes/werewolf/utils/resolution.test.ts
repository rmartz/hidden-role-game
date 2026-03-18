import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../roles";
import { resolveNightActions } from "./resolution";

const assignments = [
  { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
  { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
  { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "chup1", roleDefinitionId: WerewolfRole.Chupacabra },
  { playerId: "witch1", roleDefinitionId: WerewolfRole.Witch },
  { playerId: "sc1", roleDefinitionId: WerewolfRole.Spellcaster },
];

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
    const event = events.find((e) => e.targetPlayerId === "p1");
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
    const e = events.find((e) => e.targetPlayerId === "w1");
    expect(e?.type === "killed" && e.died).toBe(true);
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
      ["w1"], // w1 is the only werewolf and is dead
    );
    const e = events.find((e) => e.targetPlayerId === "p1");
    expect(e?.type === "killed" && e.died).toBe(true);
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
      const event = events.find((e) => e.targetPlayerId === "p1");
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
      const event = events.find((e) => e.targetPlayerId === "p2");
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
      expect(events[0]?.targetPlayerId).toBe("p1");
    });
  });

  describe("Spellcaster", () => {
    it("emits a silenced event for the targeted player", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Spellcaster]: { targetPlayerId: "p1" } },
        assignments,
        [],
      );
      expect(events).toContainEqual({ type: "silenced", targetPlayerId: "p1" });
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
