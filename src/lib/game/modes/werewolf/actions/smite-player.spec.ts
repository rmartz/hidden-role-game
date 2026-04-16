import { describe, it, expect } from "vitest";
import type { WerewolfTurnState, WerewolfNighttimePhase } from "../types";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame, makeNightState, dayTurnState } from "./test-helpers";

describe("WerewolfAction.SmitePlayer", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SmitePlayer];

  describe("isValid", () => {
    it("returns true for owner during nighttime with valid playerId", () => {
      const game = makePlayingGame(makeNightState());
      expect(action.isValid(game, "owner-1", { playerId: "p2" })).toBe(true);
    });

    it("returns true during daytime with valid playerId", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "owner-1", { playerId: "p2" })).toBe(true);
    });

    it("returns false for non-owner caller", () => {
      const game = makePlayingGame(makeNightState());
      expect(action.isValid(game, "p1", { playerId: "p2" })).toBe(false);
    });

    it("returns false for already-dead player", () => {
      const game = makePlayingGame(makeNightState({ deadPlayerIds: ["p2"] }));
      expect(action.isValid(game, "owner-1", { playerId: "p2" })).toBe(false);
    });

    it("returns false for already-smited player", () => {
      const nightState = makeNightState();
      (nightState.phase as WerewolfNighttimePhase).smitedPlayerIds = ["p2"];
      const game = makePlayingGame(nightState);
      expect(action.isValid(game, "owner-1", { playerId: "p2" })).toBe(false);
    });

    it("returns false for owner's own playerId", () => {
      const game = makePlayingGame(makeNightState());
      expect(action.isValid(game, "owner-1", { playerId: "owner-1" })).toBe(
        false,
      );
    });
  });

  describe("apply", () => {
    it("adds playerId to smitedPlayerIds", () => {
      const game = makePlayingGame(makeNightState());
      action.apply(game, { playerId: "p2" }, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.smitedPlayerIds).toEqual(["p2"]);
    });

    it("handles multiple smites in one night", () => {
      const game = makePlayingGame(makeNightState());
      action.apply(game, { playerId: "p2" }, "owner-1");
      action.apply(game, { playerId: "p3" }, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.smitedPlayerIds).toEqual(["p2", "p3"]);
    });
  });
});

describe("WerewolfAction.UnsmitePlayer", () => {
  const unsmiteAction = WEREWOLF_ACTIONS[WerewolfAction.UnsmitePlayer];

  it("isValid returns true for a smited player", () => {
    const nightState = makeNightState();
    (nightState.phase as WerewolfNighttimePhase).smitedPlayerIds = ["p2"];
    const game = makePlayingGame(nightState);
    expect(unsmiteAction.isValid(game, "owner-1", { playerId: "p2" })).toBe(
      true,
    );
  });

  it("isValid returns false for a non-smited player", () => {
    const game = makePlayingGame(makeNightState());
    expect(unsmiteAction.isValid(game, "owner-1", { playerId: "p2" })).toBe(
      false,
    );
  });

  it("removes playerId from smitedPlayerIds", () => {
    const nightState = makeNightState();
    (nightState.phase as WerewolfNighttimePhase).smitedPlayerIds = ["p2", "p3"];
    const game = makePlayingGame(nightState);
    unsmiteAction.apply(game, { playerId: "p2" }, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    expect(phase.smitedPlayerIds).toEqual(["p3"]);
  });
});
