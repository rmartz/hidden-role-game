import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfPhase } from "./types";
import type {
  WerewolfTurnState,
  WerewolfNighttimePhase,
  AnyNightAction,
  TeamNightAction,
} from "./types";
import { WerewolfRole } from "./roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./actions";
import {
  buildNightPhaseOrder,
  getTeamPhaseKey,
  computeSuggestedTarget,
  getTeamPlayerIds,
  resolveNightActions,
} from "./utils";

function makePlayingGame(
  turnState: WerewolfTurnState,
  overrides: Partial<Game> = {},
): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "p1", name: "Alice", sessionId: "s1", visibleRoles: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visibleRoles: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visibleRoles: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
    ...overrides,
  };
}

function makeNightState(
  overrides: Partial<{
    turn: number;
    nightActions: Record<string, AnyNightAction>;
    deadPlayerIds: string[];
    currentPhaseIndex: number;
    nightPhaseOrder: string[];
  }> = {},
): WerewolfTurnState {
  return {
    turn: overrides.turn ?? 1,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: overrides.nightPhaseOrder ?? [
        WerewolfRole.Werewolf,
        WerewolfRole.Seer,
      ],
      currentPhaseIndex: overrides.currentPhaseIndex ?? 0,
      nightActions: overrides.nightActions ?? {},
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
  };
}

const nightTurnState: WerewolfTurnState = {
  turn: 1,
  phase: {
    type: WerewolfPhase.Nighttime,
    startedAt: 1000,
    nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
    currentPhaseIndex: 0,
    nightActions: {},
  },
  deadPlayerIds: [],
};

const nightTurn2State: WerewolfTurnState = {
  turn: 2,
  phase: {
    type: WerewolfPhase.Nighttime,
    startedAt: 1000,
    nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
    currentPhaseIndex: 0,
    nightActions: {},
  },
  deadPlayerIds: [],
};

const dayTurnState: WerewolfTurnState = {
  turn: 1,
  phase: {
    type: WerewolfPhase.Daytime,
    startedAt: 1000,
    nightActions: {},
  },
  deadPlayerIds: [],
};

// ---------------------------------------------------------------------------
// StartNight
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartNight", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartNight];

  describe("isValid", () => {
    it("returns true during daytime when called by owner", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "owner-1", null)).toBe(true);
    });

    it("returns false during nighttime", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "owner-1", null)).toBe(false);
    });

    it("returns false when called by non-owner", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "player-2", null)).toBe(false);
    });

    it("returns false when game is not Playing", () => {
      const game: Game = {
        id: "game-1",
        lobbyId: "lobby-1",
        gameMode: GameMode.Werewolf,
        status: { type: GameStatus.Starting },
        players: [],
        roleAssignments: [],
        configuredRoleSlots: [],
        showRolesInPlay: ShowRolesInPlay.None,
        ownerPlayerId: "owner-1",
      };
      expect(action.isValid(game, "owner-1", null)).toBe(false);
    });
  });

  describe("apply", () => {
    it("transitions to nighttime on the next turn", () => {
      const game = makePlayingGame(dayTurnState);
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.turn).toBe(2);
      expect(ts.phase.type).toBe(WerewolfPhase.Nighttime);
    });

    it("builds nightPhaseOrder with team phase key for werewolves", () => {
      const game = makePlayingGame(dayTurnState);
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightPhaseOrder).toContain(getTeamPhaseKey(Team.Bad));
      expect(phase.nightPhaseOrder).toContain(WerewolfRole.Seer);
      expect(phase.nightPhaseOrder).not.toContain(WerewolfRole.Werewolf);
      expect(phase.currentPhaseIndex).toBe(0);
    });

    it("sets startedAt to a recent timestamp", () => {
      const before = Date.now();
      const game = makePlayingGame(dayTurnState);
      action.apply(game, null, "owner-1");
      const after = Date.now();
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.startedAt).toBeGreaterThanOrEqual(before);
      expect(phase.startedAt).toBeLessThanOrEqual(after);
    });
  });
});

// ---------------------------------------------------------------------------
// StartDay
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartDay", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  describe("isValid", () => {
    it("returns true during nighttime when called by owner", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "owner-1", null)).toBe(true);
    });

    it("returns false during daytime", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "owner-1", null)).toBe(false);
    });

    it("returns false when called by non-owner", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "player-2", null)).toBe(false);
    });
  });

  describe("apply", () => {
    it("transitions to daytime on the same turn", () => {
      const game = makePlayingGame(nightTurnState);
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.turn).toBe(1);
      expect(ts.phase.type).toBe(WerewolfPhase.Daytime);
    });

    it("sets startedAt to a recent timestamp", () => {
      const before = Date.now();
      const game = makePlayingGame(nightTurnState);
      action.apply(game, null, "owner-1");
      const after = Date.now();
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as { startedAt: number };
      expect(phase.startedAt).toBeGreaterThanOrEqual(before);
      expect(phase.startedAt).toBeLessThanOrEqual(after);
    });

    it("resolves night actions and adds killed players to deadPlayerIds", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [getTeamPhaseKey(Team.Bad)]: {
              votes: [],
              suggestedTargetId: "p2",
            },
          },
        }),
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).toContain("p2");
    });

    it("does not kill a player protected by Bodyguard", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [getTeamPhaseKey(Team.Bad)]: {
              votes: [],
              suggestedTargetId: "p2",
            },
            [WerewolfRole.Bodyguard]: { targetPlayerId: "p2" },
          },
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Bodyguard },
          ],
        },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).not.toContain("p2");
    });

    it("stores nightResolution in the daytime phase", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [getTeamPhaseKey(Team.Bad)]: {
              votes: [],
              suggestedTargetId: "p2",
            },
          },
        }),
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as import("./types").WerewolfDaytimePhase;
      expect(phase.nightResolution).toBeDefined();
      expect(phase.nightResolution).toHaveLength(1);
      expect(phase.nightResolution![0]).toMatchObject({
        targetPlayerId: "p2",
        died: true,
      });
    });

    it("omits nightResolution when there are no night actions", () => {
      const game = makePlayingGame(nightTurnState);
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as import("./types").WerewolfDaytimePhase;
      expect(phase.nightResolution).toBeUndefined();
    });
  });
});

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
// SetNightTarget — solo roles (existing behavior with hardcoded phase keys)
// ---------------------------------------------------------------------------

describe("WerewolfAction.SetNightTarget", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  describe("isValid — owner", () => {
    it("allows owner to set a target with explicit roleId on turn 2+", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(
        action.isValid(game, "owner-1", {
          roleId: WerewolfRole.Werewolf,
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
        { roleId: WerewolfRole.Werewolf, targetPlayerId: "p1" },
        "owner-1",
      );
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Werewolf]).toEqual({
        targetPlayerId: "p1",
      });
    });

    it("clears the night action when targetPlayerId is undefined", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p1" },
          },
        }),
      );
      action.apply(
        game,
        { roleId: WerewolfRole.Werewolf, targetPlayerId: undefined },
        "owner-1",
      );
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Werewolf]).toBeUndefined();
    });

    it("does not affect other roles when clearing", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p1" },
            [WerewolfRole.Seer]: { targetPlayerId: "p2" },
          },
        }),
      );
      action.apply(
        game,
        { roleId: WerewolfRole.Werewolf, targetPlayerId: undefined },
        "owner-1",
      );
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Werewolf]).toBeUndefined();
      expect(phase.nightActions[WerewolfRole.Seer]).toEqual({
        targetPlayerId: "p2",
      });
    });
  });

  describe("apply — player (inferred roleId, solo)", () => {
    it("sets the night action for the active role", () => {
      const game = makePlayingGame(nightTurn2State);
      action.apply(game, { targetPlayerId: "p2" }, "p1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Werewolf]).toEqual({
        targetPlayerId: "p2",
      });
    });

    it("clears the night action when targetPlayerId is undefined", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p2" },
          },
        }),
      );
      action.apply(game, { targetPlayerId: undefined }, "p1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Werewolf]).toBeUndefined();
    });

    it("overwrites a previous target", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p3" },
          },
        }),
      );
      action.apply(game, { targetPlayerId: "p2" }, "p1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Werewolf]).toEqual({
        targetPlayerId: "p2",
      });
    });
  });
});

// ---------------------------------------------------------------------------
// ConfirmNightTarget — solo roles
// ---------------------------------------------------------------------------

describe("WerewolfAction.ConfirmNightTarget", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.ConfirmNightTarget];

  describe("isValid (solo)", () => {
    it("returns true when active player has an unconfirmed target on turn 2+", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p2" },
          },
        }),
      );
      expect(action.isValid(game, "p1", null)).toBe(true);
    });

    it("returns false when no target is set", () => {
      const game = makePlayingGame(makeNightState({ turn: 2 }));
      expect(action.isValid(game, "p1", null)).toBe(false);
    });

    it("returns false when target is already confirmed", () => {
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
      expect(action.isValid(game, "p1", null)).toBe(false);
    });

    it("returns false on first turn", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 1,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p2" },
          },
        }),
      );
      expect(action.isValid(game, "p1", null)).toBe(false);
    });

    it("returns false when caller is not the active role", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p1" },
          },
        }),
      );
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    it("returns false when caller has no role assignment", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: { targetPlayerId: "p2" },
          },
        }),
        { roleAssignments: [] },
      );
      expect(action.isValid(game, "p1", null)).toBe(false);
    });

    it("returns false during daytime", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "p1", null)).toBe(false);
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
// Team targeting — buildNightPhaseOrder, SetNightTarget, ConfirmNightTarget
// ---------------------------------------------------------------------------

const TEAM_BAD_KEY = getTeamPhaseKey(Team.Bad);

function makeTeamGame(
  turnState: WerewolfTurnState,
  overrides: Partial<Game> = {},
): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      {
        id: "w1",
        name: "Wolf1",
        sessionId: "sw1",
        visibleRoles: [
          { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
        ],
      },
      {
        id: "w2",
        name: "Wolf2",
        sessionId: "sw2",
        visibleRoles: [
          { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
        ],
      },
      { id: "p3", name: "Seer", sessionId: "s3", visibleRoles: [] },
      { id: "p4", name: "Villager", sessionId: "s4", visibleRoles: [] },
    ],
    roleAssignments: [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
    ...overrides,
  };
}

function makeTeamNightState(
  overrides: Partial<{
    turn: number;
    nightActions: Record<string, AnyNightAction>;
    deadPlayerIds: string[];
    currentPhaseIndex: number;
  }> = {},
): WerewolfTurnState {
  return {
    turn: overrides.turn ?? 2,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [TEAM_BAD_KEY, WerewolfRole.Seer],
      currentPhaseIndex: overrides.currentPhaseIndex ?? 0,
      nightActions: overrides.nightActions ?? {},
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
  };
}

describe("buildNightPhaseOrder — team targeting", () => {
  it("emits a team phase key instead of individual werewolf role IDs", () => {
    const assignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, assignments);
    expect(order).toContain(TEAM_BAD_KEY);
    expect(order).toContain(WerewolfRole.Seer);
    expect(order).not.toContain(WerewolfRole.Werewolf);
  });

  it("emits team phase key even for a single werewolf", () => {
    const assignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, assignments);
    expect(order).toContain(TEAM_BAD_KEY);
    expect(order).not.toContain(WerewolfRole.Werewolf);
  });

  it("does not group Chupacabra into team phase", () => {
    const assignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "c1", roleDefinitionId: WerewolfRole.Chupacabra },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, assignments);
    expect(order).toContain(TEAM_BAD_KEY);
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

describe("getTeamPlayerIds", () => {
  const assignments = [
    { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
    { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
    { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
  ];

  it("returns alive team players with teamTargeting", () => {
    expect(getTeamPlayerIds(assignments, Team.Bad, [])).toEqual(["w1", "w2"]);
  });

  it("excludes dead players", () => {
    expect(getTeamPlayerIds(assignments, Team.Bad, ["w2"])).toEqual(["w1"]);
  });
});

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
    const teamAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(teamAction.votes).toEqual([
      { playerId: "w1", targetPlayerId: "p3" },
    ]);
    expect(teamAction.suggestedTargetId).toBe("p3");
  });

  it("second voter updates the TeamNightAction", () => {
    const game = makeTeamGame(makeTeamNightState());
    action.apply(game, { targetPlayerId: "p3" }, "w1");
    action.apply(game, { targetPlayerId: "p4" }, "w2");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    const teamAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(teamAction.votes).toHaveLength(2);
    // Tied — no suggested target.
    expect(teamAction.suggestedTargetId).toBeUndefined();
  });

  it("voter can change their vote", () => {
    const game = makeTeamGame(makeTeamNightState());
    action.apply(game, { targetPlayerId: "p3" }, "w1");
    action.apply(game, { targetPlayerId: "p4" }, "w1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    const teamAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(teamAction.votes).toEqual([
      { playerId: "w1", targetPlayerId: "p4" },
    ]);
  });

  it("voter can clear their vote", () => {
    const game = makeTeamGame(makeTeamNightState());
    action.apply(game, { targetPlayerId: "p3" }, "w1");
    action.apply(game, { targetPlayerId: undefined }, "w1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    const teamAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(teamAction.votes).toEqual([]);
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
    const teamAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(teamAction.votes).toEqual([
      { playerId: "w1", targetPlayerId: "p4" },
      { playerId: "w2", targetPlayerId: "p4" },
    ]);
    expect(teamAction.suggestedTargetId).toBe("p4");
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
    const teamAction = phase.nightActions[TEAM_BAD_KEY] as TeamNightAction;
    expect(teamAction.confirmed).toBe(true);
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
        { id: "p1", name: "Alice", sessionId: "s1", visibleRoles: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visibleRoles: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visibleRoles: [] },
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
      [getTeamPhaseKey(Team.Bad)]: { votes: [], suggestedTargetId: "p2" },
      [WerewolfRole.Bodyguard]: { targetPlayerId: "p2" },
    };
    const result = resolveNightActions(nightActions, assignments, []);
    const event = result.find((e) => e.targetPlayerId === "p2");
    expect(event?.died).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RevealInvestigationResult
// ---------------------------------------------------------------------------

describe("RevealInvestigationResult", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.RevealInvestigationResult];

  const seerNightPhaseOrder = [WerewolfRole.Seer];

  function makeSeerGame(nightState: WerewolfTurnState): Game {
    return makePlayingGame(nightState, {
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visibleRoles: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visibleRoles: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visibleRoles: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
  }

  it("is valid when Seer has confirmed an investigation", () => {
    const game = makeSeerGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: seerNightPhaseOrder,
        nightActions: {
          [WerewolfRole.Seer]: { targetPlayerId: "p2", confirmed: true },
        },
      }),
    );
    expect(action.isValid(game, "owner-1", null)).toBe(true);
  });

  it("is invalid when action is not confirmed", () => {
    const game = makeSeerGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: seerNightPhaseOrder,
        nightActions: {
          [WerewolfRole.Seer]: { targetPlayerId: "p2" },
        },
      }),
    );
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("is invalid when result is already revealed", () => {
    const game = makeSeerGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: seerNightPhaseOrder,
        nightActions: {
          [WerewolfRole.Seer]: {
            targetPlayerId: "p2",
            confirmed: true,
            resultRevealed: true,
          },
        },
      }),
    );
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("is invalid when active phase is not an Investigate role", () => {
    const game = makePlayingGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: [WerewolfRole.Bodyguard],
        nightActions: {
          [WerewolfRole.Bodyguard]: { targetPlayerId: "p3", confirmed: true },
        },
      }),
      {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Bodyguard },
        ],
      },
    );
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("is invalid for non-owner callers", () => {
    const game = makeSeerGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: seerNightPhaseOrder,
        nightActions: {
          [WerewolfRole.Seer]: { targetPlayerId: "p2", confirmed: true },
        },
      }),
    );
    expect(action.isValid(game, "p1", null)).toBe(false);
  });

  it("apply sets resultRevealed to true", () => {
    const game = makeSeerGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: seerNightPhaseOrder,
        nightActions: {
          [WerewolfRole.Seer]: { targetPlayerId: "p2", confirmed: true },
        },
      }),
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    expect(phase.nightActions[WerewolfRole.Seer]).toMatchObject({
      targetPlayerId: "p2",
      confirmed: true,
      resultRevealed: true,
    });
  });
});
