import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { resolveNightActions } from "../resolution";

describe("resolveNightActions", () => {
  describe("Swapper", () => {
    const swapperAssignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "sw1", roleDefinitionId: WerewolfRole.Swapper },
      { playerId: "sc1", roleDefinitionId: WerewolfRole.Spellcaster },
      { playerId: "mummy1", roleDefinitionId: WerewolfRole.Mummy },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
    ];

    it("swaps a kill from the attacked player to the other selected player", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Swapper]: {
            targetPlayerId: "p1",
            secondTargetPlayerId: "p2",
          },
        },
        swapperAssignments,
        [],
      );
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toBeUndefined();

      const p2Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p2",
      );
      expect(p2Event).toMatchObject({ died: true });

      expect(events.find((e) => e.type === "swapper-swapped")).toMatchObject({
        type: "swapper-swapped",
        firstPlayerId: "p1",
        secondPlayerId: "p2",
      });
    });

    it("swaps kill in the reverse direction (second player attacked)", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p2" },
          [WerewolfRole.Swapper]: {
            targetPlayerId: "p1",
            secondTargetPlayerId: "p2",
          },
        },
        swapperAssignments,
        [],
      );
      const p2Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p2",
      );
      expect(p2Event).toBeUndefined();

      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toMatchObject({ died: true });
    });

    it("swaps protection: attacked player and protected player switch effects", () => {
      // p1 is attacked, p2 is protected. After swap:
      // p1 receives p2's protection (survives), p2 receives p1's attack (dies).
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "p2" },
          [WerewolfRole.Swapper]: {
            targetPlayerId: "p1",
            secondTargetPlayerId: "p2",
          },
        },
        [
          ...swapperAssignments,
          { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
        ],
        [],
      );
      // p1 now has the protection (no attack) — no killed event
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toBeUndefined();

      // p2 now has the attack (no protection) — dies
      const p2Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p2",
      );
      expect(p2Event).toMatchObject({ died: true });
    });

    it("swaps silence: the other player is silenced instead", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Spellcaster]: { targetPlayerId: "p1" },
          [WerewolfRole.Swapper]: {
            targetPlayerId: "p1",
            secondTargetPlayerId: "p2",
          },
        },
        swapperAssignments,
        [],
      );
      const p1Silenced = events.find(
        (e) => e.type === "silenced" && e.targetPlayerId === "p1",
      );
      expect(p1Silenced).toBeUndefined();

      const p2Silenced = events.find(
        (e) => e.type === "silenced" && e.targetPlayerId === "p2",
      );
      expect(p2Silenced).toBeDefined();
    });

    it("swaps hypnosis: the other player is hypnotized instead", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Mummy]: { targetPlayerId: "p1" },
          [WerewolfRole.Swapper]: {
            targetPlayerId: "p1",
            secondTargetPlayerId: "p2",
          },
        },
        swapperAssignments,
        [],
      );
      const p1Hypnotized = events.find(
        (e) => e.type === "hypnotized" && e.targetPlayerId === "p1",
      );
      expect(p1Hypnotized).toBeUndefined();

      const p2Hypnotized = events.find(
        (e) => e.type === "hypnotized" && e.targetPlayerId === "p2",
      );
      expect(p2Hypnotized).toBeDefined();
    });

    it("emits no swap event when Swapper skips", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Swapper]: { skipped: true },
        },
        swapperAssignments,
        [],
      );
      expect(events.find((e) => e.type === "swapper-swapped")).toBeUndefined();
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toMatchObject({ died: true });
    });

    it("emits no swap event when Swapper has not acted", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
        },
        swapperAssignments,
        [],
      );
      expect(events.find((e) => e.type === "swapper-swapped")).toBeUndefined();
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toMatchObject({ died: true });
    });

    it("swap when neither player is affected produces a swap event but no effect changes", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p3" },
          [WerewolfRole.Swapper]: {
            targetPlayerId: "p1",
            secondTargetPlayerId: "p2",
          },
        },
        swapperAssignments,
        [],
      );
      expect(events.find((e) => e.type === "swapper-swapped")).toMatchObject({
        firstPlayerId: "p1",
        secondPlayerId: "p2",
      });
      // p3 is still killed (unaffected by swap)
      const p3Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p3",
      );
      expect(p3Event).toMatchObject({ died: true });
    });

    it("attack-and-protection on one player is fully moved to the other when swapped", () => {
      // p1 is both attacked and protected; p2 is neither attacked nor protected.
      // After swap: p2 is attacked and protected (dies: false), p1 has nothing.
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "p1" },
          [WerewolfRole.Swapper]: {
            targetPlayerId: "p1",
            secondTargetPlayerId: "p2",
          },
        },
        [
          ...swapperAssignments,
          { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
        ],
        [],
      );
      const p1Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p1",
      );
      expect(p1Event).toBeUndefined();

      const p2Event = events.find(
        (e) => e.type === "killed" && e.targetPlayerId === "p2",
      );
      expect(p2Event).toMatchObject({ died: false });
    });
  });
});
