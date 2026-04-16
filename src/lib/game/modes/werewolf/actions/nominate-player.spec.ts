import { describe, it, expect } from "vitest";
import { GameMode } from "@/lib/types";
import { WerewolfPhase, TrialVerdict, TrialPhase } from "../types";
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

describe("WerewolfAction.NominatePlayer — apply", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.NominatePlayer];

  it("adds a nomination for the defendant", () => {
    const game = makePlayingGame(makeDayState(), {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    action.apply(game, { defendantId: "p3" }, "p2");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as Extract<
      WerewolfTurnState["phase"],
      { type: WerewolfPhase.Daytime }
    >;
    expect(phase.nominations).toContainEqual({
      nominatorId: "p2",
      defendantId: "p3",
    });
  });

  it("replaces an existing nomination when caller re-nominates", () => {
    const game = makePlayingGame(
      makeDayState([{ nominatorId: "p2", defendantId: "p3" }]),
      {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          trialsPerDay: 1,
          revealProtections: true,
          showRolesOnDeath: true,
        },
      },
    );
    action.apply(game, { defendantId: "p4" }, "p2");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as Extract<
      WerewolfTurnState["phase"],
      { type: WerewolfPhase.Daytime }
    >;
    expect(
      phase.nominations?.filter((n) => n.nominatorId === "p2"),
    ).toHaveLength(1);
    expect(phase.nominations).toContainEqual({
      nominatorId: "p2",
      defendantId: "p4",
    });
    expect(phase.nominations).not.toContainEqual({
      nominatorId: "p2",
      defendantId: "p3",
    });
  });

  it("auto-starts a trial when nomination count reaches threshold", () => {
    const game = makePlayingGame(
      makeDayState([{ nominatorId: "p2", defendantId: "p3" }]),
      {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          trialsPerDay: 1,
          revealProtections: true,
          showRolesOnDeath: true,
        },
      },
    );
    action.apply(game, { defendantId: "p3" }, "p4");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as Extract<
      WerewolfTurnState["phase"],
      { type: WerewolfPhase.Daytime }
    >;
    expect(phase.activeTrial).toBeDefined();
    expect(phase.activeTrial?.defendantId).toBe("p3");
  });

  it("clears nominations when a trial auto-starts", () => {
    const game = makePlayingGame(
      makeDayState([{ nominatorId: "p2", defendantId: "p3" }]),
      {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          trialsPerDay: 1,
          revealProtections: true,
          showRolesOnDeath: true,
        },
      },
    );
    action.apply(game, { defendantId: "p3" }, "p4");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as Extract<
      WerewolfTurnState["phase"],
      { type: WerewolfPhase.Daytime }
    >;
    expect(phase.nominations).toEqual([]);
  });

  it("does not start a trial when count is below threshold", () => {
    const game = makePlayingGame(makeDayState(), {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    action.apply(game, { defendantId: "p3" }, "p2");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as Extract<
      WerewolfTurnState["phase"],
      { type: WerewolfPhase.Daytime }
    >;
    expect(phase.activeTrial).toBeUndefined();
  });
});

describe("WerewolfAction.NominatePlayer — isValid", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.NominatePlayer];

  it("returns false when nominationsEnabled is false", () => {
    const game = makePlayingGame(makeDayState());
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns true for a valid nomination", () => {
    const game = makePlayingGame(makeDayState(), {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(true);
  });

  it("returns false when caller is the owner", () => {
    const game = makePlayingGame(makeDayState(), {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "owner-1", { defendantId: "p3" })).toBe(false);
  });

  it("returns false during nighttime", () => {
    const game = makePlayingGame(makeNightState(), {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
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
          phase: TrialPhase.Defense,
          votes: [],
        },
      },
      deadPlayerIds: [],
    };
    const game = makePlayingGame(ts, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns true when trial has a verdict (resolved) and trialsPerDay is 0 (unlimited)", () => {
    const ts: WerewolfTurnState = {
      turn: 1,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
        activeTrial: {
          defendantId: "p1",
          startedAt: 2000,
          phase: TrialPhase.Voting,
          votes: [],
          verdict: TrialVerdict.Innocent,
        },
      },
      deadPlayerIds: [],
    };
    const game = makePlayingGame(ts, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 0,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(true);
  });

  it("returns false when caller is dead", () => {
    const ts: WerewolfTurnState = {
      ...makeDayState(),
      deadPlayerIds: ["p2"],
    };
    const game = makePlayingGame(ts, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns false when defendant is dead", () => {
    const ts: WerewolfTurnState = {
      ...makeDayState(),
      deadPlayerIds: ["p3"],
    };
    const game = makePlayingGame(ts, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns false when caller nominates themselves", () => {
    const game = makePlayingGame(makeDayState(), {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "p2" })).toBe(false);
  });

  it("returns false when defendant is the owner", () => {
    const game = makePlayingGame(makeDayState(), {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "owner-1" })).toBe(false);
  });

  it("returns false when caller already nominated the same defendant", () => {
    const game = makePlayingGame(
      makeDayState([{ nominatorId: "p2", defendantId: "p3" }]),
      {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          trialsPerDay: 1,
          revealProtections: true,
          showRolesOnDeath: true,
        },
      },
    );
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns false when caller is silenced", () => {
    const ts: WerewolfTurnState = { ...makeDayState() };
    (ts.phase as WerewolfDaytimePhase).nightResolution = [
      { type: "silenced", targetPlayerId: "p2" },
    ];
    const game = makePlayingGame(ts, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "p3" })).toBe(false);
  });

  it("returns true when caller changes their nomination to a different defendant", () => {
    const game = makePlayingGame(
      makeDayState([{ nominatorId: "p2", defendantId: "p3" }]),
      {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          trialsPerDay: 1,
          revealProtections: true,
          showRolesOnDeath: true,
        },
      },
    );
    expect(action.isValid(game, "p2", { defendantId: "p4" })).toBe(true);
  });
});

describe("WerewolfAction.NominatePlayer — trialsPerDay", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.NominatePlayer];

  it("blocks nomination when the trials-per-day limit has been reached", () => {
    const ds = makeDayState();
    (ds.phase as WerewolfDaytimePhase).concludedTrialsCount = 1;
    const game = makePlayingGame(ds, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "p4" })).toBe(false);
  });

  it("allows nomination when trials-per-day limit has not been reached", () => {
    const ds = makeDayState();
    (ds.phase as WerewolfDaytimePhase).concludedTrialsCount = 1;
    const game = makePlayingGame(ds, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 2,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "p4" })).toBe(true);
  });

  it("blocks nomination when concludedTrialsCount equals the default limit of 2", () => {
    const ds = makeDayState();
    (ds.phase as WerewolfDaytimePhase).concludedTrialsCount = 2;
    const game = makePlayingGame(ds, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 2,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "p4" })).toBe(false);
  });

  it("allows nomination when trialsPerDay is 0 (unlimited)", () => {
    const ds = makeDayState();
    (ds.phase as WerewolfDaytimePhase).concludedTrialsCount = 5;
    const game = makePlayingGame(ds, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 0,
        revealProtections: true,
        showRolesOnDeath: true,
      },
    });
    expect(action.isValid(game, "p2", { defendantId: "p4" })).toBe(true);
  });
});
