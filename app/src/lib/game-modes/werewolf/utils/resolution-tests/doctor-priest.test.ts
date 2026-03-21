import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import {
  resolveNightActions,
  getInterimAttackedPlayerIds,
} from "../resolution";
import { findKilled } from "./helpers";

describe("resolveNightActions", () => {
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
      const event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
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
      const event = findKilled(events, "p1");
      expect(event).toMatchObject({ died: false });
      expect(event?.protectedBy).toContain(WerewolfRole.Doctor);
      expect(event?.protectedBy).toContain(WerewolfRole.Bodyguard);
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
      const event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
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
      const event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
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
      const event = findKilled(events, "p1");
      expect(event).toMatchObject({ died: false });
      expect(event?.protectedBy).toContain(WerewolfRole.Priest);
      expect(event?.protectedBy).toContain(WerewolfRole.Bodyguard);
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
});
