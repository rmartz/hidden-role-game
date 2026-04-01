import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { resolveNightActions } from "../resolution";

describe("resolveNightActions", () => {
  describe("Mirrorcaster", () => {
    const mcAssignments = [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Mirrorcaster },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Bodyguard },
    ];

    describe("Protect mode (uncharged)", () => {
      it("protects a player who is not attacked — no effect on deaths", () => {
        const events = resolveNightActions(
          {
            [WerewolfRole.Mirrorcaster]: { targetPlayerId: "p3" },
            [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p4" },
          },
          mcAssignments,
          [],
        );

        const p4Event = events.find(
          (e) => e.type === "killed" && e.targetPlayerId === "p4",
        );
        expect(p4Event).toMatchObject({ died: true });

        const p3Event = events.find(
          (e) => e.type === "killed" && e.targetPlayerId === "p3",
        );
        expect(p3Event).toBeUndefined();
      });

      it("protects a player who is attacked — player survives", () => {
        const events = resolveNightActions(
          {
            [WerewolfRole.Mirrorcaster]: { targetPlayerId: "p3" },
            [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p3" },
          },
          mcAssignments,
          [],
        );

        const p3Event = events.find(
          (e) => e.type === "killed" && e.targetPlayerId === "p3",
        );
        expect(p3Event).toMatchObject({
          died: false,
          protectedBy: expect.arrayContaining([
            WerewolfRole.Mirrorcaster,
          ]) as string[],
        });
      });

      it("protection stacks with other protections", () => {
        const events = resolveNightActions(
          {
            [WerewolfRole.Mirrorcaster]: { targetPlayerId: "p3" },
            [WerewolfRole.Bodyguard]: { targetPlayerId: "p3" },
            [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p3" },
          },
          mcAssignments,
          [],
        );

        const p3Event = events.find(
          (e) => e.type === "killed" && e.targetPlayerId === "p3",
        );
        expect(p3Event).toMatchObject({
          died: false,
          protectedBy: expect.arrayContaining([
            WerewolfRole.Mirrorcaster,
            WerewolfRole.Bodyguard,
          ]) as string[],
        });
      });

      it("does NOT attack even when targeting a player", () => {
        const events = resolveNightActions(
          {
            [WerewolfRole.Mirrorcaster]: { targetPlayerId: "p3" },
          },
          mcAssignments,
          [],
          [],
          { mirrorcasterCharged: false },
        );

        const p3Event = events.find(
          (e) => e.type === "killed" && e.targetPlayerId === "p3",
        );
        expect(p3Event).toBeUndefined();
      });
    });

    describe("Attack mode (charged)", () => {
      it("attacks like a standard attacker", () => {
        const events = resolveNightActions(
          {
            [WerewolfRole.Mirrorcaster]: { targetPlayerId: "p3" },
          },
          mcAssignments,
          [],
          [],
          { mirrorcasterCharged: true },
        );

        const p3Event = events.find(
          (e) => e.type === "killed" && e.targetPlayerId === "p3",
        );
        expect(p3Event).toMatchObject({
          died: true,
          attackedBy: expect.arrayContaining([
            WerewolfRole.Mirrorcaster,
          ]) as string[],
        });
      });

      it("attack is blockable by Bodyguard", () => {
        const events = resolveNightActions(
          {
            [WerewolfRole.Mirrorcaster]: { targetPlayerId: "p3" },
            [WerewolfRole.Bodyguard]: { targetPlayerId: "p3" },
          },
          mcAssignments,
          [],
          [],
          { mirrorcasterCharged: true },
        );

        const p3Event = events.find(
          (e) => e.type === "killed" && e.targetPlayerId === "p3",
        );
        expect(p3Event).toMatchObject({
          died: false,
          attackedBy: expect.arrayContaining([
            WerewolfRole.Mirrorcaster,
          ]) as string[],
          protectedBy: expect.arrayContaining([
            WerewolfRole.Bodyguard,
          ]) as string[],
        });
      });

      it("attack combined with Werewolf attack", () => {
        const events = resolveNightActions(
          {
            [WerewolfRole.Mirrorcaster]: { targetPlayerId: "p3" },
            [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p3" },
          },
          mcAssignments,
          [],
          [],
          { mirrorcasterCharged: true },
        );

        const p3Event = events.find(
          (e) => e.type === "killed" && e.targetPlayerId === "p3",
        );
        expect(p3Event).toMatchObject({
          died: true,
          attackedBy: expect.arrayContaining([
            WerewolfRole.Mirrorcaster,
            WerewolfRole.Werewolf,
          ]) as string[],
        });
      });
    });
  });
});
