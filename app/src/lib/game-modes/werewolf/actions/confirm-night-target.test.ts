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
import {
  makePlayingGame,
  makeNightState,
  dayTurnState,
  makeTeamGame,
  makeTeamNightState,
  TEAM_BAD_KEY,
} from "./test-helpers";
import type { Game } from "@/lib/types";

// ---------------------------------------------------------------------------
// ConfirmNightTarget — solo roles
// ---------------------------------------------------------------------------

describe("WerewolfAction.ConfirmNightTarget", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.ConfirmNightTarget];

  describe("isValid (solo)", () => {
    // Use Seer (p2) as the active solo role.
    const seerActiveState = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
      currentPhaseIndex: 0,
    });

    it("returns true when active player has an unconfirmed target on turn 2+", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1" },
          },
        }),
      );
      expect(action.isValid(game, "p2", null)).toBe(true);
    });

    it("returns false when no target is set", () => {
      const game = makePlayingGame(seerActiveState);
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    it("returns false when target is already confirmed", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1", confirmed: true },
          },
        }),
      );
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    it("returns false on first turn", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 1,
          nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1" },
          },
        }),
      );
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    it("returns false when caller is not the active role", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1" },
          },
        }),
      );
      expect(action.isValid(game, "p1", null)).toBe(false);
    });

    it("returns false when caller has no role assignment", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1" },
          },
        }),
        { roleAssignments: [] },
      );
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    it("returns false during daytime", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "p2", null)).toBe(false);
    });
  });

  describe("apply (solo)", () => {
    it("sets confirmed to true on the active role's night action", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p2" },
          },
        }),
      );
      action.apply(game, null, "p1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Werewolf]).toEqual({
        targetPlayerId: "p2",
        confirmed: true,
      });
    });

    it("does not affect other roles", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p2" },
            [WerewolfRole.Seer]: { targetPlayerId: "p3" },
          },
        }),
      );
      action.apply(game, null, "p1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Seer]).toEqual({
        targetPlayerId: "p3",
      });
    });
  });
});

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
// ConfirmNightTarget — Witch witchAbilityUsed
// ---------------------------------------------------------------------------

describe("ConfirmNightTarget — sets witchAbilityUsed for Witch", () => {
  const confirmAction = WEREWOLF_ACTIONS[WerewolfAction.ConfirmNightTarget];
  const setTargetAction = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  it("sets witchAbilityUsed on the turn state after Witch confirms", () => {
    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Nighttime,
        startedAt: 1000,
        nightPhaseOrder: [WerewolfRole.Witch],
        currentPhaseIndex: 0,
        nightActions: {},
      },
      deadPlayerIds: [],
    };
    const game = makePlayingGame(ts, {
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Witch },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });

    setTargetAction.apply(game, { targetPlayerId: "p2" }, "p1");
    expect(confirmAction.isValid(game, "p1", undefined)).toBe(true);
    confirmAction.apply(game, null, "p1");

    const resultTs = (game.status as { turnState: WerewolfTurnState })
      .turnState;
    expect(resultTs.witchAbilityUsed).toBe(true);
  });

  it("witchAbilityUsed is carried forward into the next night", () => {
    const startNight = WEREWOLF_ACTIONS[WerewolfAction.StartNight];
    const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Nighttime,
        startedAt: 1000,
        nightPhaseOrder: [WerewolfRole.Witch],
        currentPhaseIndex: 0,
        nightActions: {
          [WerewolfRole.Witch]: { targetPlayerId: "p2", confirmed: true },
        },
      },
      deadPlayerIds: [],
      witchAbilityUsed: true,
    };
    // Werewolf added to prevent Village win after Witch kills p2
    const game = makePlayingGame(ts, {
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
        { id: "p4", name: "Dan", sessionId: "s4", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Witch },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Werewolf },
      ],
    });

    startDay.apply(game, null, "owner-1");
    startNight.apply(game, null, "owner-1");

    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.witchAbilityUsed).toBe(true);
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
    // The active phase key is the suffixed key; confirmed on the base key must not block.
    expect(action.isValid(game, "w1", null)).toBe(true);
  });
});
