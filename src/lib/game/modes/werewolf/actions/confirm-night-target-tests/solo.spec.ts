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
