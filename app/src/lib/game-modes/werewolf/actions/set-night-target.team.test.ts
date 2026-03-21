import { describe, it, expect } from "vitest";
import type {
  WerewolfTurnState,
  WerewolfNighttimePhase,
  TeamNightAction,
} from "../types";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makeTeamGame, makeTeamNightState, TEAM_BAD_KEY } from "./test-helpers";

// ---------------------------------------------------------------------------
// SetNightTarget — team phase
// ---------------------------------------------------------------------------

describe("SetNightTarget — team phase", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  it("player can vote in a team phase", () => {
    const game = makeTeamGame(makeTeamNightState());
    expect(action.isValid(game, "w1", { targetPlayerId: "p3" })).toBe(true);
  });

  it("werewolf cannot target another werewolf", () => {
    const game = makeTeamGame(makeTeamNightState());
    expect(action.isValid(game, "w1", { targetPlayerId: "w2" })).toBe(false);
  });

  it("non-team player cannot vote in team phase", () => {
    const game = makeTeamGame(makeTeamNightState());
    expect(action.isValid(game, "p3", { targetPlayerId: "p4" })).toBe(false);
  });

  it("apply creates a TeamNightAction with the voter's entry", () => {
    const game = makeTeamGame(makeTeamNightState());
    action.apply(game, { targetPlayerId: "p3" }, "w1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    const groupAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(groupAction.votes).toEqual([
      { playerId: "w1", targetPlayerId: "p3" },
    ]);
    expect(groupAction.suggestedTargetId).toBe("p3");
  });

  it("second voter updates the TeamNightAction", () => {
    const game = makeTeamGame(makeTeamNightState());
    action.apply(game, { targetPlayerId: "p3" }, "w1");
    action.apply(game, { targetPlayerId: "p4" }, "w2");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    const groupAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(groupAction.votes).toHaveLength(2);
    expect(groupAction.suggestedTargetId).toBeUndefined();
  });

  it("voter can change their vote", () => {
    const game = makeTeamGame(makeTeamNightState());
    action.apply(game, { targetPlayerId: "p3" }, "w1");
    action.apply(game, { targetPlayerId: "p4" }, "w1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    const groupAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(groupAction.votes).toEqual([
      { playerId: "w1", targetPlayerId: "p4" },
    ]);
  });

  it("voter can clear their vote", () => {
    const game = makeTeamGame(makeTeamNightState());
    action.apply(game, { targetPlayerId: "p3" }, "w1");
    action.apply(game, { targetPlayerId: undefined }, "w1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    const groupAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(groupAction.votes).toEqual([]);
  });

  it("owner override sets all alive team members' votes", () => {
    const game = makeTeamGame(makeTeamNightState());
    action.apply(
      game,
      { roleId: TEAM_BAD_KEY, targetPlayerId: "p4" },
      "owner-1",
    );
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    const groupAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(groupAction.votes).toEqual([
      { playerId: "w1", targetPlayerId: "p4" },
      { playerId: "w2", targetPlayerId: "p4" },
    ]);
    expect(groupAction.suggestedTargetId).toBe("p4");
  });

  it("blocks voting after team confirmed", () => {
    const game = makeTeamGame(
      makeTeamNightState({
        nightActions: {
          [TEAM_BAD_KEY]: {
            votes: [
              { playerId: "w1", targetPlayerId: "p3" },
              { playerId: "w2", targetPlayerId: "p3" },
            ],
            suggestedTargetId: "p3",
            confirmed: true,
          },
        },
      }),
    );
    expect(action.isValid(game, "w1", { targetPlayerId: "p4" })).toBe(false);
  });
});
