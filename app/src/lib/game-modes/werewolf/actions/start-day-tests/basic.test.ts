import { describe, it, expect } from "vitest";
import type {
  WerewolfTurnState,
  WerewolfDaytimePhase,
  WerewolfNighttimePhase,
} from "../../types";
import { WerewolfPhase } from "../../types";
import { WerewolfRole } from "../../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../index";
import {
  makePlayingGame,
  makeNightState,
  nightTurnState,
  dayTurnState,
} from "../test-helpers";

// ---------------------------------------------------------------------------
// StartDay — isValid + basic apply
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartDay — isValid", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("returns true during nighttime when called by owner", () => {
    const game = makePlayingGame(nightTurnState);
    expect(action.isValid(game, "owner-1", null)).toBe(true);
  });

  it("returns false during daytime", () => {
    const game = makePlayingGame(dayTurnState);
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("returns false when called by non-owner", () => {
    const game = makePlayingGame(nightTurnState);
    expect(action.isValid(game, "player-2", null)).toBe(false);
  });
});

describe("WerewolfAction.StartDay — basic apply", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("transitions to daytime on the same turn", () => {
    const game = makePlayingGame(nightTurnState);
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.turn).toBe(1);
    expect(ts.phase.type).toBe(WerewolfPhase.Daytime);
  });

  it("sets startedAt to a recent timestamp", () => {
    const before = Date.now();
    const game = makePlayingGame(nightTurnState);
    action.apply(game, null, "owner-1");
    const after = Date.now();
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as { startedAt: number };
    expect(phase.startedAt).toBeGreaterThanOrEqual(before);
    expect(phase.startedAt).toBeLessThanOrEqual(after);
  });

  it("resolves night actions and adds killed players to deadPlayerIds", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
        },
      }),
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p2");
  });

  it("stores nightResolution in the daytime phase", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
        },
      }),
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfDaytimePhase;
    expect(phase.nightResolution).toBeDefined();
    expect(phase.nightResolution).toHaveLength(1);
    expect(phase.nightResolution![0]).toMatchObject({
      type: "killed",
      targetPlayerId: "p2",
      died: true,
    });
  });

  it("omits nightResolution when there are no night actions", () => {
    const game = makePlayingGame(nightTurnState);
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfDaytimePhase;
    expect(phase.nightResolution).toBeUndefined();
  });

  it("smited player appears in deadPlayerIds after start-day", () => {
    const nightState = makeNightState();
    (nightState.phase as WerewolfNighttimePhase).smitedPlayerIds = ["p3"];
    const game = makePlayingGame(nightState);
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p3");
  });

  it("smitedPlayerIds is carried to the daytime phase", () => {
    const nightState = makeNightState();
    (nightState.phase as WerewolfNighttimePhase).smitedPlayerIds = ["p3", "p4"];
    const game = makePlayingGame(nightState);
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfDaytimePhase;
    expect(phase.smitedPlayerIds).toEqual(["p3", "p4"]);
  });
});
