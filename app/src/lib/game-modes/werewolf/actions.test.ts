import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/models";
import type { Game } from "@/lib/models";
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
    players: [],
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

const nightTurnState: WerewolfTurnState = {
  turn: 1,
  phase: {
    type: WerewolfPhase.Nighttime,
    nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
    currentPhaseIndex: 0,
  },
};

const dayTurnState: WerewolfTurnState = {
  turn: 1,
  phase: { type: WerewolfPhase.Daytime, startedAt: 1000 },
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
