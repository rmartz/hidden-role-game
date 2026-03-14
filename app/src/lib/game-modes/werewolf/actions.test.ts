import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfPhase } from "./types";
import type { WerewolfTurnState, WerewolfNighttimePhase } from "./types";
import { WerewolfRole } from "./roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./actions";

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
    nightActions: Record<string, { targetPlayerId: string }>;
    deadPlayerIds: string[];
    currentPhaseIndex: number;
  }> = {},
): WerewolfTurnState {
  return {
    turn: overrides.turn ?? 1,
    phase: {
      type: WerewolfPhase.Nighttime,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
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
      action.apply(game, null);
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.turn).toBe(2);
      expect(ts.phase.type).toBe(WerewolfPhase.Nighttime);
    });

    it("builds nightPhaseOrder from current role assignments", () => {
      const game = makePlayingGame(dayTurnState);
      action.apply(game, null);
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightPhaseOrder).toContain(WerewolfRole.Werewolf);
      expect(phase.nightPhaseOrder).toContain(WerewolfRole.Seer);
      expect(phase.currentPhaseIndex).toBe(0);
    });
  });
});

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
      action.apply(game, null);
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.turn).toBe(1);
      expect(ts.phase.type).toBe(WerewolfPhase.Daytime);
    });

    it("sets startedAt to a recent timestamp", () => {
      const before = Date.now();
      const game = makePlayingGame(nightTurnState);
      action.apply(game, null);
      const after = Date.now();
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as { startedAt: number };
      expect(phase.startedAt).toBeGreaterThanOrEqual(before);
      expect(phase.startedAt).toBeLessThanOrEqual(after);
    });
  });
});

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
      action.apply(game, { phaseIndex: 1 });
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.currentPhaseIndex).toBe(1);
    });

    it("preserves nightPhaseOrder and turn", () => {
      const game = makePlayingGame(nightTurnState);
      action.apply(game, { phaseIndex: 1 });
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(ts.turn).toBe(1);
      expect(phase.nightPhaseOrder).toEqual([
        WerewolfRole.Werewolf,
        WerewolfRole.Seer,
      ]);
    });
  });
});

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

  describe("isValid — player", () => {
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
      // p2 is Seer, but Werewolf (p1) is active at index 0
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
  });

  describe("apply — owner (explicit roleId)", () => {
    it("sets the night action for the specified role", () => {
      const game = makePlayingGame(nightTurn2State);
      action.apply(game, {
        roleId: WerewolfRole.Werewolf,
        targetPlayerId: "p1",
      });
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
      action.apply(game, {
        roleId: WerewolfRole.Werewolf,
        targetPlayerId: undefined,
      });
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
      action.apply(game, {
        roleId: WerewolfRole.Werewolf,
        targetPlayerId: undefined,
      });
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Werewolf]).toBeUndefined();
      expect(phase.nightActions[WerewolfRole.Seer]).toEqual({
        targetPlayerId: "p2",
      });
    });
  });

  describe("apply — player (inferred roleId)", () => {
    it("sets the night action for the active role", () => {
      const game = makePlayingGame(nightTurn2State);
      action.apply(game, { targetPlayerId: "p2" });
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
      action.apply(game, { targetPlayerId: undefined });
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
      action.apply(game, { targetPlayerId: "p2" });
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightActions[WerewolfRole.Werewolf]).toEqual({
        targetPlayerId: "p2",
      });
    });
  });
});
