import { describe, it, expect } from "vitest";
import type { Game } from "@/lib/types";
import type {
  WerewolfTurnState,
  WerewolfNighttimePhase,
  AnyNightAction,
  TeamNightAction,
} from "../types";
import { WerewolfPhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { resolveNightActions } from "../utils";
import {
  makePlayingGame,
  makeNightState,
  nightTurn2State,
  nightTurnState,
  dayTurnState,
  makeTeamGame,
  makeTeamNightState,
  TEAM_BAD_KEY,
} from "./test-helpers";

// ---------------------------------------------------------------------------
// SetNightTarget — solo roles (existing behavior with hardcoded phase keys)
// ---------------------------------------------------------------------------

describe("WerewolfAction.SetNightTarget", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  describe("isValid — owner", () => {
    it("allows owner to set a target with explicit roleId on turn 2+", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(
        action.isValid(game, "owner-1", {
          roleId: WerewolfRole.Seer,
          targetPlayerId: "p1",
        }),
      ).toBe(true);
    });
  });

  describe("isValid — player (solo role)", () => {
    it("returns true when active player targets a valid player on turn 2+", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(true);
    });

    it("returns true when active player clears target (undefined targetPlayerId)", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p1", { targetPlayerId: undefined })).toBe(
        true,
      );
    });

    it("returns false on first turn", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(false);
    });

    it("returns false when caller is not the active role", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p2", { targetPlayerId: "p1" })).toBe(false);
    });

    it("returns false when targeting the game owner", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p1", { targetPlayerId: "owner-1" })).toBe(
        false,
      );
    });

    it("returns false when targeting a non-existent player", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p1", { targetPlayerId: "unknown" })).toBe(
        false,
      );
    });

    it("returns false when targeting a dead player", () => {
      const game = makePlayingGame(
        makeNightState({ turn: 2, deadPlayerIds: ["p2"] }),
      );
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(false);
    });

    it("returns false during daytime", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(false);
    });

    it("returns false when targetPlayerId is not a string", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p1", { targetPlayerId: 123 })).toBe(false);
    });

    it("returns false when caller has no role assignment", () => {
      const game = makePlayingGame(nightTurn2State, { roleAssignments: [] });
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(false);
    });

    it("returns false when player's target is already confirmed", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: {
              targetPlayerId: "p2",
              confirmed: true,
            },
          },
        }),
      );
      expect(action.isValid(game, "p1", { targetPlayerId: "p3" })).toBe(false);
    });

    it("allows owner to override a confirmed target", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: {
              targetPlayerId: "p2",
              confirmed: true,
            },
          },
        }),
      );
      expect(
        action.isValid(game, "owner-1", {
          roleId: WerewolfRole.Werewolf,
          targetPlayerId: "p3",
        }),
      ).toBe(true);
    });
  });

  describe("apply — owner (explicit roleId, solo)", () => {
    it("sets the night action for the specified role", () => {
      const game = makePlayingGame(nightTurn2State);
      action.apply(
        game,
        { roleId: WerewolfRole.Seer, targetPlayerId: "p1" },
        "owner-1",
      );
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Seer]).toEqual({
        targetPlayerId: "p1",
      });
    });

    it("clears the night action when targetPlayerId is undefined", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1" },
          },
        }),
      );
      action.apply(
        game,
        { roleId: WerewolfRole.Seer, targetPlayerId: undefined },
        "owner-1",
      );
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Seer]).toBeUndefined();
    });

    it("does not affect other roles when clearing", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p1" },
            [WerewolfRole.Bodyguard]: { targetPlayerId: "p3" },
          },
        }),
      );
      action.apply(
        game,
        { roleId: WerewolfRole.Seer, targetPlayerId: undefined },
        "owner-1",
      );
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Seer]).toBeUndefined();
      expect(phase.nightActions[WerewolfRole.Bodyguard]).toEqual({
        targetPlayerId: "p3",
      });
    });
  });

  describe("apply — player (inferred roleId, solo)", () => {
    // Use Seer (p2) as the active solo role by putting Seer first in the phase order.
    const seerActiveState = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
      currentPhaseIndex: 0,
    });

    it("sets the night action for the active role", () => {
      const game = makePlayingGame(seerActiveState);
      action.apply(game, { targetPlayerId: "p1" }, "p2");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Seer]).toEqual({
        targetPlayerId: "p1",
      });
    });

    it("clears the night action when targetPlayerId is undefined", () => {
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
      action.apply(game, { targetPlayerId: undefined }, "p2");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Seer]).toBeUndefined();
    });

    it("overwrites a previous target", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Seer]: { targetPlayerId: "p3" },
          },
        }),
      );
      action.apply(game, { targetPlayerId: "p1" }, "p2");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Seer]).toEqual({
        targetPlayerId: "p1",
      });
    });
  });
});

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
    // p3 is Seer, not on Bad team
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
    // Tied — no suggested target.
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

// ---------------------------------------------------------------------------
// Bodyguard self-targeting
// ---------------------------------------------------------------------------

describe("SetNightTarget — Bodyguard self-targeting", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  function makeBodyguardGame(nightState: WerewolfTurnState): Game {
    return makePlayingGame(nightState, {
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Bodyguard },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
  }

  const bodyguardNightState = makeNightState({
    turn: 2,
    nightPhaseOrder: [WerewolfRole.Bodyguard],
  });

  it("Bodyguard can target themselves", () => {
    const game = makeBodyguardGame(bodyguardNightState);
    expect(action.isValid(game, "p1", { targetPlayerId: "p1" })).toBe(true);
  });

  it("Attack role cannot target themselves", () => {
    const game = makePlayingGame(nightTurn2State);
    // p1 is Werewolf (Attack), targeting themselves
    expect(action.isValid(game, "p1", { targetPlayerId: "p1" })).toBe(false);
  });

  it("Bodyguard self-protection is applied by resolveNightActions", () => {
    const assignments = [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Bodyguard },
    ];
    const nightActions = {
      [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p2" },
      [WerewolfRole.Bodyguard]: { targetPlayerId: "p2" },
    };
    const events = resolveNightActions(nightActions, assignments, []);
    const event = events.find((e) => e.targetPlayerId === "p2");
    expect(event?.type === "killed" && event.died).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Witch ability
// ---------------------------------------------------------------------------

describe("SetNightTarget — Witch once-per-game restriction", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  function makeWitchGame(witchAbilityUsed = false) {
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
      ...(witchAbilityUsed ? { witchAbilityUsed: true } : {}),
    };
    return makePlayingGame(ts, {
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
  }

  it("Witch can set target when ability not yet used", () => {
    const game = makeWitchGame(false);
    expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(true);
  });

  it("Witch cannot set target when ability already used", () => {
    const game = makeWitchGame(true);
    expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SetNightTarget / ConfirmNightTarget — suffixed repeat group phase (Wolf Cub bonus)
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

describe("SetNightTarget — suffixed repeat group phase", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  it("rejects targeting the same player as the first phase's suggestedTargetId", () => {
    const game = makeWolfCubBonusGame({
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
    });
    expect(action.isValid(game, "w1", { targetPlayerId: "p3" })).toBe(false);
  });

  it("allows targeting a different player in the second phase", () => {
    const game = makeWolfCubBonusGame({
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
    });
    expect(action.isValid(game, "w1", { targetPlayerId: "p4" })).toBe(true);
  });
});
