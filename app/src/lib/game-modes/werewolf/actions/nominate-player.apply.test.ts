import { describe, it, expect } from "vitest";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
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

describe("WerewolfAction.NominatePlayer — apply", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.NominatePlayer];

  it("adds a nomination for the defendant", () => {
    const game = makePlayingGame(makeDayState(), {
      nominationsEnabled: true,
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
      { nominationsEnabled: true },
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
      { nominationsEnabled: true },
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
      { nominationsEnabled: true },
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
      nominationsEnabled: true,
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
