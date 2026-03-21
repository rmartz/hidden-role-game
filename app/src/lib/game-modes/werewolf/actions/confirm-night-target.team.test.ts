import { describe, it, expect } from "vitest";
import type {
  WerewolfTurnState,
  WerewolfNighttimePhase,
  AnyNightAction,
  TeamNightAction,
} from "../types";
import { WerewolfPhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makeTeamGame, makeTeamNightState, TEAM_BAD_KEY } from "./test-helpers";
import type { Game } from "@/lib/types";

// ---------------------------------------------------------------------------
// ConfirmNightTarget — team phase
// ---------------------------------------------------------------------------

describe("ConfirmNightTarget — team phase", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.ConfirmNightTarget];

  it("returns true when all alive team members agree", () => {
    const game = makeTeamGame(
      makeTeamNightState({
        nightActions: {
          [TEAM_BAD_KEY]: {
            votes: [
              { playerId: "w1", targetPlayerId: "p3" },
              { playerId: "w2", targetPlayerId: "p3" },
            ],
            suggestedTargetId: "p3",
          },
        },
      }),
    );
    expect(action.isValid(game, "w1", null)).toBe(true);
  });

  it("returns false when votes disagree", () => {
    const game = makeTeamGame(
      makeTeamNightState({
        nightActions: {
          [TEAM_BAD_KEY]: {
            votes: [
              { playerId: "w1", targetPlayerId: "p3" },
              { playerId: "w2", targetPlayerId: "p4" },
            ],
            suggestedTargetId: undefined,
          },
        },
      }),
    );
    expect(action.isValid(game, "w1", null)).toBe(false);
  });

  it("returns false when not all team members have voted", () => {
    const game = makeTeamGame(
      makeTeamNightState({
        nightActions: {
          [TEAM_BAD_KEY]: {
            votes: [{ playerId: "w1", targetPlayerId: "p3" }],
            suggestedTargetId: "p3",
          },
        },
      }),
    );
    expect(action.isValid(game, "w1", null)).toBe(false);
  });

  it("considers only alive members (dead member excluded)", () => {
    const game = makeTeamGame(
      makeTeamNightState({
        deadPlayerIds: ["w2"],
        nightActions: {
          [TEAM_BAD_KEY]: {
            votes: [{ playerId: "w1", targetPlayerId: "p3" }],
            suggestedTargetId: "p3",
          },
        },
      }),
    );
    expect(action.isValid(game, "w1", null)).toBe(true);
  });

  it("returns false when already confirmed", () => {
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
    expect(action.isValid(game, "w1", null)).toBe(false);
  });

  it("apply sets confirmed to true on the team action", () => {
    const game = makeTeamGame(
      makeTeamNightState({
        nightActions: {
          [TEAM_BAD_KEY]: {
            votes: [
              { playerId: "w1", targetPlayerId: "p3" },
              { playerId: "w2", targetPlayerId: "p3" },
            ],
            suggestedTargetId: "p3",
          },
        },
      }),
    );
    action.apply(game, null, "w1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    const groupAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(groupAction.confirmed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ConfirmNightTarget — suffixed repeat group phase (Wolf Cub bonus)
// ---------------------------------------------------------------------------

const WOLF_CUB_BONUS_PHASE_KEY = `${WerewolfRole.Werewolf as string}:2`;

function makeWolfCubBonusGame(
  nightActions: Record<string, AnyNightAction> = {},
): Game {
  return makeTeamGame({
    turn: 2,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf, WOLF_CUB_BONUS_PHASE_KEY],
      currentPhaseIndex: 1,
      nightActions,
    },
    deadPlayerIds: [],
  });
}

describe("ConfirmNightTarget — suffixed repeat group phase", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.ConfirmNightTarget];

  it("succeeds for the second Werewolf phase when all alive participants have voted", () => {
    const game = makeWolfCubBonusGame({
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
      [WOLF_CUB_BONUS_PHASE_KEY]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p4" },
          { playerId: "w2", targetPlayerId: "p4" },
        ],
        suggestedTargetId: "p4",
      },
    });
    expect(action.isValid(game, "w1", null)).toBe(true);
  });

  it("second phase confirm is valid regardless of first phase confirmed state", () => {
    const game = makeWolfCubBonusGame({
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
      [WOLF_CUB_BONUS_PHASE_KEY]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p4" },
          { playerId: "w2", targetPlayerId: "p4" },
        ],
        suggestedTargetId: "p4",
      },
    });
    expect(action.isValid(game, "w1", null)).toBe(true);
  });
});
