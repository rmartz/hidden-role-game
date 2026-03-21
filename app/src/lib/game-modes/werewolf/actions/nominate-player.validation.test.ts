import { describe, it, expect } from "vitest";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState, WerewolfDaytimePhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame } from "./test-helpers";

function makeDayState(
  nominations: { nominatorId: string; defendantId: string }[] = [],
): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      ...(nominations.length > 0 ? { nominations } : {}),
    },
    deadPlayerIds: [],
  };
}

function makeNightState(): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf],
      currentPhaseIndex: 0,
      nightActions: {},
    },
    deadPlayerIds: [],
  };
}

describe("WerewolfAction.NominatePlayer — isValid", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.NominatePlayer];

  it("returns false when nominationsEnabled is false", () => {
    const game = makePlayingGame(makeDayState());
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns true for a valid nomination", () => {
    const game = makePlayingGame(makeDayState(), {
      nominationsEnabled: true,
    });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(true);
  });

  it("returns false when caller is the owner", () => {
    const game = makePlayingGame(makeDayState(), {
      nominationsEnabled: true,
    });
    expect(action.isValid(game, "owner-1", { defendantId: "p3" })).toBe(false);
  });

  it("returns false during nighttime", () => {
    const game = makePlayingGame(makeNightState(), {
      nominationsEnabled: true,
    });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns false when an active unresolved trial is in progress", () => {
    const ts: WerewolfTurnState = {
      turn: 1,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
        activeTrial: {
          defendantId: "p1",
          startedAt: 2000,
          phase: "defense",
          votes: [],
        },
      },
      deadPlayerIds: [],
    };
    const game = makePlayingGame(ts, { nominationsEnabled: true });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns true when trial has a verdict (resolved) and singleTrialPerDay is off", () => {
    const ts: WerewolfTurnState = {
      turn: 1,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
        activeTrial: {
          defendantId: "p1",
          startedAt: 2000,
          phase: "voting",
          votes: [],
          verdict: "innocent",
        },
      },
      deadPlayerIds: [],
    };
    const game = makePlayingGame(ts, {
      nominationsEnabled: true,
      singleTrialPerDay: false,
    });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(true);
  });

  it("returns false when caller is dead", () => {
    const ts: WerewolfTurnState = {
      ...makeDayState(),
      deadPlayerIds: ["p2"],
    };
    const game = makePlayingGame(ts, { nominationsEnabled: true });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns false when defendant is dead", () => {
    const ts: WerewolfTurnState = {
      ...makeDayState(),
      deadPlayerIds: ["p3"],
    };
    const game = makePlayingGame(ts, { nominationsEnabled: true });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns false when caller nominates themselves", () => {
    const game = makePlayingGame(makeDayState(), {
      nominationsEnabled: true,
    });
    expect(action.isValid(game, "p2", { defendantId: "p2" })).toBe(false);
  });

  it("returns false when defendant is the owner", () => {
    const game = makePlayingGame(makeDayState(), {
      nominationsEnabled: true,
    });
    expect(action.isValid(game, "p2", { defendantId: "owner-1" })).toBe(false);
  });

  it("returns false when caller already nominated the same defendant", () => {
    const game = makePlayingGame(
      makeDayState([{ nominatorId: "p2", defendantId: "p3" }]),
      { nominationsEnabled: true },
    );
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns false when caller is silenced", () => {
    const ts: WerewolfTurnState = { ...makeDayState() };
    (ts.phase as WerewolfDaytimePhase).nightResolution = [
      { type: "silenced", targetPlayerId: "p2" },
    ];
    const game = makePlayingGame(ts, { nominationsEnabled: true });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns true when caller changes their nomination to a different defendant", () => {
    const game = makePlayingGame(
      makeDayState([{ nominatorId: "p2", defendantId: "p3" }]),
      { nominationsEnabled: true },
    );
    expect(action.isValid(game, "p2", { defendantId: "p4" })).toBe(true);
  });
});

describe("WerewolfAction.NominatePlayer — singleTrialPerDay", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.NominatePlayer];

  it("blocks nomination after a trial has concluded", () => {
    const ds = makeDayState();
    (ds.phase as WerewolfDaytimePhase).activeTrial = {
      defendantId: "p3",
      startedAt: 2000,
      phase: "voting",
      votes: [{ playerId: "p4", vote: "guilty" }],
      verdict: "eliminated",
    };
    const game = makePlayingGame(ds, {
      nominationsEnabled: true,
      singleTrialPerDay: true,
    });
    expect(action.isValid(game, "p2", { defendantId: "p4" })).toBe(false);
  });

  it("allows nomination after a trial has concluded when singleTrialPerDay is false", () => {
    const ds = makeDayState();
    (ds.phase as WerewolfDaytimePhase).activeTrial = {
      defendantId: "p3",
      startedAt: 2000,
      phase: "voting",
      votes: [{ playerId: "p4", vote: "guilty" }],
      verdict: "eliminated",
    };
    const game = makePlayingGame(ds, {
      nominationsEnabled: true,
      singleTrialPerDay: false,
    });
    expect(action.isValid(game, "p2", { defendantId: "p4" })).toBe(true);
  });
});
