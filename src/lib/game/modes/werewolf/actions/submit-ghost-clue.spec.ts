import { describe, it, expect } from "vitest";
import type { Game } from "@/lib/types";
import type { WerewolfTurnState } from "../types";
import { WerewolfPhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame } from "./test-helpers";

const action = WEREWOLF_ACTIONS[WerewolfAction.SubmitGhostClue];

function makeGhostGame(
  turnState: WerewolfTurnState,
  overrides: Partial<Game> = {},
): Game {
  return makePlayingGame(turnState, {
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Ghost },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
    ],
    ...overrides,
  });
}

const dayTurnState: WerewolfTurnState = {
  turn: 2,
  phase: {
    type: WerewolfPhase.Daytime,
    startedAt: 1000,
    nightActions: {},
  },
  deadPlayerIds: ["p2"],
};

describe("SubmitGhostClue action", () => {
  it("is valid when the caller is a dead Ghost during daytime", () => {
    const game = makeGhostGame(dayTurnState);
    expect(action.isValid(game, "p2", { clue: "wolf" })).toBe(true);
  });

  it("is invalid when the caller is alive", () => {
    const aliveDayState: WerewolfTurnState = {
      ...dayTurnState,
      deadPlayerIds: [],
    };
    const game = makeGhostGame(aliveDayState);
    expect(action.isValid(game, "p2", { clue: "wolf" })).toBe(false);
  });

  it("is invalid when the caller is not the Ghost", () => {
    const game = makeGhostGame({
      ...dayTurnState,
      deadPlayerIds: ["p3"],
    });
    expect(action.isValid(game, "p3", { clue: "wolf" })).toBe(false);
  });

  it("is invalid during nighttime", () => {
    const nightTurnState: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Nighttime,
        startedAt: 1000,
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
        currentPhaseIndex: 0,
        nightActions: {},
      },
      deadPlayerIds: ["p2"],
    };
    const game = makeGhostGame(nightTurnState);
    expect(action.isValid(game, "p2", { clue: "wolf" })).toBe(false);
  });

  it("is invalid when the clue exceeds 20 characters", () => {
    const game = makeGhostGame(dayTurnState);
    expect(action.isValid(game, "p2", { clue: "a".repeat(21) })).toBe(false);
  });

  it("is invalid when the clue is an empty string", () => {
    const game = makeGhostGame(dayTurnState);
    expect(action.isValid(game, "p2", { clue: "" })).toBe(false);
  });

  it("is invalid when the clue is whitespace only", () => {
    const game = makeGhostGame(dayTurnState);
    expect(action.isValid(game, "p2", { clue: "   " })).toBe(false);
  });

  it("is invalid when the Ghost has already submitted a clue this turn", () => {
    const stateWithClue: WerewolfTurnState = {
      ...dayTurnState,
      ghostClues: [{ turn: 2, clue: "wolf" }],
    };
    const game = makeGhostGame(stateWithClue);
    expect(action.isValid(game, "p2", { clue: "moon" })).toBe(false);
  });

  it("is valid when the Ghost submitted a clue on a previous turn but not this turn", () => {
    const stateWithOldClue: WerewolfTurnState = {
      ...dayTurnState,
      ghostClues: [{ turn: 1, clue: "moon" }],
    };
    const game = makeGhostGame(stateWithOldClue);
    expect(action.isValid(game, "p2", { clue: "wolf" })).toBe(true);
  });

  it("stores the clue in ghostClues after apply", () => {
    const game = makeGhostGame(dayTurnState);
    action.apply(game, { clue: "wolf" }, "p2");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.ghostClues).toEqual([{ turn: 2, clue: "wolf" }]);
  });

  it("appends to existing ghostClues from previous turns", () => {
    const stateWithOldClue: WerewolfTurnState = {
      ...dayTurnState,
      ghostClues: [{ turn: 1, clue: "moon" }],
    };
    const game = makeGhostGame(stateWithOldClue);
    action.apply(game, { clue: "wolf" }, "p2");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.ghostClues).toEqual([
      { turn: 1, clue: "moon" },
      { turn: 2, clue: "wolf" },
    ]);
  });
});
