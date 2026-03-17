import { describe, it, expect } from "vitest";
import type { WerewolfTurnState, WerewolfNighttimePhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import {
  buildNightPhaseOrder,
  computeSuggestedTarget,
  getGroupPhasePlayerIds,
} from "../utils";
import { makePlayingGame, nightTurnState, dayTurnState } from "./test-helpers";

// ---------------------------------------------------------------------------
// SetNightPhase
// ---------------------------------------------------------------------------

describe("WerewolfAction.SetNightPhase", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightPhase];

  describe("isValid", () => {
    it("returns true for a valid index during nighttime", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "owner-1", { phaseIndex: 1 })).toBe(true);
    });

    it("returns true for index 0", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "owner-1", { phaseIndex: 0 })).toBe(true);
    });

    it("returns false for an out-of-bounds index", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "owner-1", { phaseIndex: 2 })).toBe(false);
    });

    it("returns false for a negative index", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "owner-1", { phaseIndex: -1 })).toBe(false);
    });

    it("returns false during daytime", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "owner-1", { phaseIndex: 0 })).toBe(false);
    });

    it("returns false when called by non-owner", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "player-2", { phaseIndex: 0 })).toBe(false);
    });

    it("returns false when phaseIndex is not a number", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "owner-1", { phaseIndex: "0" })).toBe(false);
    });
  });

  describe("apply", () => {
    it("updates currentPhaseIndex", () => {
      const game = makePlayingGame(nightTurnState);
      action.apply(game, { phaseIndex: 1 }, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.currentPhaseIndex).toBe(1);
    });

    it("preserves nightPhaseOrder and turn", () => {
      const game = makePlayingGame(nightTurnState);
      action.apply(game, { phaseIndex: 1 }, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(ts.turn).toBe(1);
      expect(phase.nightPhaseOrder).toEqual([
        WerewolfRole.Werewolf,
        WerewolfRole.Seer,
      ]);
    });

    it("resets startedAt to a recent timestamp", () => {
      const before = Date.now();
      const game = makePlayingGame(nightTurnState);
      action.apply(game, { phaseIndex: 1 }, "owner-1");
      const after = Date.now();
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.startedAt).toBeGreaterThanOrEqual(before);
      expect(phase.startedAt).toBeLessThanOrEqual(after);
    });
  });
});

// ---------------------------------------------------------------------------
// Team targeting utility function tests
// ---------------------------------------------------------------------------

describe("buildNightPhaseOrder — team targeting", () => {
  it("emits a single Werewolf group phase key for multiple werewolves", () => {
    const assignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, assignments);
    expect(order).toContain(WerewolfRole.Werewolf);
    expect(order).toContain(WerewolfRole.Seer);
    expect(
      order.filter((k) => k === (WerewolfRole.Werewolf as string)),
    ).toHaveLength(1);
  });

  it("emits group phase key even for a single werewolf", () => {
    const assignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, assignments);
    expect(order).toContain(WerewolfRole.Werewolf);
    expect(
      order.filter((k) => k === (WerewolfRole.Werewolf as string)),
    ).toHaveLength(1);
  });

  it("does not group Chupacabra into team phase", () => {
    const assignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "c1", roleDefinitionId: WerewolfRole.Chupacabra },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, assignments);
    expect(order).toContain(WerewolfRole.Werewolf);
    expect(order).toContain(WerewolfRole.Chupacabra);
  });
});

describe("computeSuggestedTarget", () => {
  it("returns the most-voted target", () => {
    expect(
      computeSuggestedTarget([
        { playerId: "w1", targetPlayerId: "p3" },
        { playerId: "w2", targetPlayerId: "p3" },
      ]),
    ).toBe("p3");
  });

  it("returns undefined on a tie", () => {
    expect(
      computeSuggestedTarget([
        { playerId: "w1", targetPlayerId: "p3" },
        { playerId: "w2", targetPlayerId: "p4" },
      ]),
    ).toBeUndefined();
  });

  it("returns undefined for no votes", () => {
    expect(computeSuggestedTarget([])).toBeUndefined();
  });

  it("returns the single vote when only one exists", () => {
    expect(
      computeSuggestedTarget([{ playerId: "w1", targetPlayerId: "p4" }]),
    ).toBe("p4");
  });
});

describe("getGroupPhasePlayerIds", () => {
  const assignments = [
    { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
    { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
    { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
  ];

  it("returns alive team players with teamTargeting", () => {
    expect(
      getGroupPhasePlayerIds(assignments, WerewolfRole.Werewolf, []),
    ).toEqual(["w1", "w2"]);
  });

  it("excludes dead players", () => {
    expect(
      getGroupPhasePlayerIds(assignments, WerewolfRole.Werewolf, ["w2"]),
    ).toEqual(["w1"]);
  });
});
