import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../roles";
import {
  resolveNightActions,
  SMITE_PHASE_KEY,
  getInterimAttackedPlayerIds,
} from "./resolution";

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
      const event = events.find((e) => e.targetPlayerId === "p1");
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
      const event = events.find((e) => e.targetPlayerId === "p1");
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
      const event = events.find((e) => e.targetPlayerId === "p1");
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

  describe("Doctor", () => {
    const doctorAssignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "doc1", roleDefinitionId: WerewolfRole.Doctor },
      { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
    ];

    it("protects an attacked player from a werewolf kill", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Doctor]: { targetPlayerId: "p1" },
        },
        doctorAssignments,
        [],
      );
      const event = events.find((e) => e.targetPlayerId === "p1");
      expect(event).toMatchObject({
        attackedBy: [WerewolfRole.Werewolf],
        protectedBy: [WerewolfRole.Doctor],
        died: false,
      });
    });

    it("Doctor and Bodyguard both protecting same player — player survives", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Doctor]: { targetPlayerId: "p1" },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "p1" },
        },
        doctorAssignments,
        [],
      );
      const event = events.find((e) => e.targetPlayerId === "p1");
      expect(event).toMatchObject({
        died: false,
      });
      expect(event?.type === "killed" && event.protectedBy).toContain(
        WerewolfRole.Doctor,
      );
      expect(event?.type === "killed" && event.protectedBy).toContain(
        WerewolfRole.Bodyguard,
      );
    });
  });

  describe("Priest", () => {
    const priestAssignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "priest1", roleDefinitionId: WerewolfRole.Priest },
      { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
    ];

    it("ward protects a warded player from attack via options.priestWards", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
        },
        priestAssignments,
        [],
        undefined,
        { priestWards: { p1: "priest1" } },
      );
      const event = events.find((e) => e.targetPlayerId === "p1");
      expect(event).toMatchObject({
        attackedBy: [WerewolfRole.Werewolf],
        protectedBy: [WerewolfRole.Priest],
        died: false,
      });
    });

    it("Priest is excluded from the generic collectBaseAttacksAndProtections pipeline", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Priest]: { targetPlayerId: "p1" },
        },
        priestAssignments,
        [],
      );
      const event = events.find((e) => e.targetPlayerId === "p1");
      expect(event).toMatchObject({
        protectedBy: [],
        died: true,
      });
    });

    it("ward and Bodyguard both protecting same player — both show in protectedBy", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "p1" },
        },
        priestAssignments,
        [],
        undefined,
        { priestWards: { p1: "priest1" } },
      );
      const event = events.find((e) => e.targetPlayerId === "p1");
      expect(event).toMatchObject({ died: false });
      expect(event?.type === "killed" && event.protectedBy).toContain(
        WerewolfRole.Priest,
      );
      expect(event?.type === "killed" && event.protectedBy).toContain(
        WerewolfRole.Bodyguard,
      );
    });

    it("warded player shown as protected via getInterimAttackedPlayerIds", () => {
      const attackedIds = getInterimAttackedPlayerIds(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
        },
        priestAssignments,
        [],
        { p1: "priest1" },
      );
      expect(attackedIds).not.toContain("p1");
    });
  });

  describe("Tough Guy", () => {
    const toughGuyAssignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "tg1", roleDefinitionId: WerewolfRole.ToughGuy },
      { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
    ];

    it("absorbs first attack (died=false, tough-guy-absorbed event emitted)", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "tg1" },
        },
        toughGuyAssignments,
        [],
      );
      const killedEvent = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "tg1",
      );
      expect(killedEvent).toMatchObject({ died: false });
      const absorbedEvent = events.find(
        (e) => e.type === "tough-guy-absorbed" && e.targetPlayerId === "tg1",
      );
      expect(absorbedEvent).toBeDefined();
    });

    it("dies on second attack when already in toughGuyHitIds", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "tg1" },
        },
        toughGuyAssignments,
        [],
        undefined,
        { toughGuyHitIds: ["tg1"] },
      );
      const killedEvent = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "tg1",
      );
      expect(killedEvent).toMatchObject({ died: true });
      const absorbedEvent = events.find((e) => e.type === "tough-guy-absorbed");
      expect(absorbedEvent).toBeUndefined();
    });

    it("is protected by Bodyguard — ability not consumed (no tough-guy-absorbed event)", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "tg1" },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "tg1" },
        },
        toughGuyAssignments,
        [],
      );
      const killedEvent = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "tg1",
      );
      expect(killedEvent).toMatchObject({ died: false });
      const absorbedEvent = events.find((e) => e.type === "tough-guy-absorbed");
      expect(absorbedEvent).toBeUndefined();
    });
  });

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
      // p1 is not attacked — wolves targeted the Altruist
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
      // p1 is protected by Bodyguard — Altruist intercept is a no-op
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
      // p2 is not being attacked — intercept has no effect
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toMatchObject({ died: true });
      expect(
        events.find((e) => e.type === "altruist-intercepted"),
      ).toBeUndefined();
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
