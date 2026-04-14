import { describe, it, expect } from "vitest";
import type { WerewolfTurnState, WerewolfNighttimePhase } from "../../types";
import { WerewolfRole } from "../../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../index";
import { makePlayingGame, makeNightState, dayTurnState } from "../test-helpers";

// ---------------------------------------------------------------------------
// ConfirmNightTarget — solo roles
// ---------------------------------------------------------------------------

describe("WerewolfAction.ConfirmNightTarget", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.ConfirmNightTarget];

  describe("isValid (solo)", () => {
    const seerActiveState = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
      currentPhaseIndex: 0,
    });

    it("returns true when active player has an unconfirmed target on turn 2+", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1" },
          },
        }),
      );
      expect(action.isValid(game, "p2", null)).toBe(true);
    });

    it("returns false when no target is set", () => {
      const game = makePlayingGame(seerActiveState);
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    it("returns false when target is already confirmed", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1", confirmed: true },
          },
        }),
      );
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    it("returns false on first turn", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 1,
          nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1" },
          },
        }),
      );
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    it("returns false when caller is not the active role", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1" },
          },
        }),
      );
      expect(action.isValid(game, "p1", null)).toBe(false);
    });

    it("returns false when caller has no role assignment", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1" },
          },
        }),
        { roleAssignments: [] },
      );
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    it("returns false during daytime", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    describe("Mentalist dual target behavior", () => {
      it("returns false when only one target is selected", () => {
        const game = makePlayingGame(
          makeNightState({
            turn: 2,
            nightPhaseOrder: [WerewolfRole.Mentalist],
            currentPhaseIndex: 0,
            nightActions: {
              [WerewolfRole.Mentalist]: { targetPlayerId: "p1" },
            },
          }),
          {
            roleAssignments: [
              { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
              { playerId: "p2", roleDefinitionId: WerewolfRole.Mentalist },
              { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
              { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
              { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
            ],
          },
        );
        expect(action.isValid(game, "p2", null)).toBe(false);
      });

      it("returns true when two targets are selected", () => {
        const game = makePlayingGame(
          makeNightState({
            turn: 2,
            nightPhaseOrder: [WerewolfRole.Mentalist],
            currentPhaseIndex: 0,
            nightActions: {
              [WerewolfRole.Mentalist]: {
                targetPlayerId: "p1",
                secondTargetPlayerId: "p3",
              },
            },
          }),
          {
            roleAssignments: [
              { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
              { playerId: "p2", roleDefinitionId: WerewolfRole.Mentalist },
              { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
              { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
              { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
            ],
          },
        );
        expect(action.isValid(game, "p2", null)).toBe(true);
      });

      it("returns true when Mentalist chooses no target", () => {
        const game = makePlayingGame(
          makeNightState({
            turn: 2,
            nightPhaseOrder: [WerewolfRole.Mentalist],
            currentPhaseIndex: 0,
            nightActions: {
              [WerewolfRole.Mentalist]: { skipped: true },
            },
          }),
          {
            roleAssignments: [
              { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
              { playerId: "p2", roleDefinitionId: WerewolfRole.Mentalist },
              { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
              { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
              { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
            ],
          },
        );
        expect(action.isValid(game, "p2", null)).toBe(true);
      });
    });
  });

  describe("apply (solo)", () => {
    it("sets confirmed to true on the active role's night action", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p2" },
          },
        }),
      );
      action.apply(game, null, "p1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Werewolf]).toEqual({
        targetPlayerId: "p2",
        confirmed: true,
      });
    });

    it("does not affect other roles", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p2" },
            [WerewolfRole.Seer]: { targetPlayerId: "p3" },
          },
        }),
      );
      action.apply(game, null, "p1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Seer]).toEqual({
        targetPlayerId: "p3",
      });
    });
  });
});
