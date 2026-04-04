import { describe, it, expect } from "vitest";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState, WerewolfDaytimePhase } from "../types";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame } from "./test-helpers";

function makeDayStateWithTrial(
  phase: "defense" | "voting",
  verdict?: "eliminated" | "innocent",
): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      activeTrial: {
        defendantId: "p2",
        startedAt: 2000,
        phase,
        votes: [],
        ...(verdict ? { verdict } : {}),
      },
    },
    deadPlayerIds: [],
  };
}

describe("WerewolfAction.CancelTrial", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.CancelTrial];

  describe("isValid", () => {
    it("returns true during defense phase", () => {
      const game = makePlayingGame(makeDayStateWithTrial("defense"));
      expect(action.isValid(game, "owner-1", null)).toBe(true);
    });

    it("returns true during voting phase", () => {
      const game = makePlayingGame(makeDayStateWithTrial("voting"));
      expect(action.isValid(game, "owner-1", null)).toBe(true);
    });

    it("returns false after verdict", () => {
      const game = makePlayingGame(
        makeDayStateWithTrial("voting", "eliminated"),
      );
      expect(action.isValid(game, "owner-1", null)).toBe(false);
    });

    it("returns false when no active trial", () => {
      const ts: WerewolfTurnState = {
        turn: 1,
        phase: {
          type: WerewolfPhase.Daytime,
          startedAt: 1000,
          nightActions: {},
        },
        deadPlayerIds: [],
      };
      const game = makePlayingGame(ts);
      expect(action.isValid(game, "owner-1", null)).toBe(false);
    });

    it("returns false for non-owner", () => {
      const game = makePlayingGame(makeDayStateWithTrial("defense"));
      expect(action.isValid(game, "p2", null)).toBe(false);
    });
  });

  describe("apply", () => {
    it("clears activeTrial entirely", () => {
      const game = makePlayingGame(makeDayStateWithTrial("voting"));
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfDaytimePhase;
      expect(phase.activeTrial).toBeUndefined();
    });

    it("does not affect deadPlayerIds", () => {
      const game = makePlayingGame(makeDayStateWithTrial("defense"));
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).toEqual([]);
    });
  });
});
