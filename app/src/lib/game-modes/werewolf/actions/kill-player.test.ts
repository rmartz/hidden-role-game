import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { WerewolfWinner } from "../utils/win-condition";
import { makePlayingGame, dayTurnState, nightTurnState } from "./test-helpers";

function freshDayState(): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
    },
    deadPlayerIds: [],
  };
}

describe("WerewolfAction.KillPlayer", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.KillPlayer];

  describe("isValid", () => {
    it("returns true during daytime for an alive player", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "owner-1", { playerId: "p2" })).toBe(true);
    });

    it("returns false during nighttime", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "owner-1", { playerId: "p2" })).toBe(false);
    });

    it("returns false for non-owner caller", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "p2", { playerId: "p3" })).toBe(false);
    });

    it("returns false for already dead player", () => {
      const ts: WerewolfTurnState = {
        ...dayTurnState,
        deadPlayerIds: ["p2"],
      };
      const game = makePlayingGame(ts);
      expect(action.isValid(game, "owner-1", { playerId: "p2" })).toBe(false);
    });

    it("returns false when targeting the owner", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "owner-1", { playerId: "owner-1" })).toBe(
        false,
      );
    });

    it("returns false for invalid payload", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "owner-1", {})).toBe(false);
      expect(action.isValid(game, "owner-1", { playerId: 123 })).toBe(false);
    });
  });

  describe("apply", () => {
    it("adds player to deadPlayerIds", () => {
      const game = makePlayingGame(freshDayState());
      action.apply(game, { playerId: "p3" }, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).toContain("p3");
    });

    it("triggers Village win when last wolf is killed", () => {
      const game = makePlayingGame(freshDayState(), {
        players: [
          { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
          { id: "p2", name: "Seer", sessionId: "s2", visiblePlayers: [] },
          { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, { playerId: "p1" }, "owner-1");
      expect(game.status.type).toBe(GameStatus.Finished);
      expect((game.status as { winner?: string }).winner).toBe(
        WerewolfWinner.Village,
      );
    });

    it("triggers Werewolf win when kill tips the balance", () => {
      // 1 wolf + 2 good → kill one good → 1v1 → wolves win
      const game = makePlayingGame(freshDayState(), {
        players: [
          { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
          { id: "p2", name: "Seer", sessionId: "s2", visiblePlayers: [] },
          { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, { playerId: "p2" }, "owner-1");
      expect(game.status.type).toBe(GameStatus.Finished);
      expect((game.status as { winner?: string }).winner).toBe(
        WerewolfWinner.Werewolves,
      );
    });

    it("does not end game when kill does not trigger a win condition", () => {
      const game = makePlayingGame(freshDayState());
      action.apply(game, { playerId: "p3" }, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
    });

    it("sets wolfCubDied when killing the Wolf Cub", () => {
      const game = makePlayingGame(freshDayState(), {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.WolfCub },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, { playerId: "p2" }, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.wolfCubDied).toBe(true);
    });
  });
});
