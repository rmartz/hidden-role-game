import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../roles";
import { resolveNightActions } from "./resolution";

describe("resolveNightActions", () => {
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
});
