import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { WerewolfPhase, TrialVerdict, TrialPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { WerewolfWinner } from "../utils/win-condition";
import { makePlayingGame } from "./test-helpers";

// ---------------------------------------------------------------------------
// AdvanceMartyrWindow
// ---------------------------------------------------------------------------

function makeDayStateWithPendingGuilt(
  pendingGuiltId: string,
  deadPlayerIds: string[] = [],
): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      activeTrial: {
        defendantId: pendingGuiltId,
        startedAt: 2000,
        phase: TrialPhase.Voting,
        verdict: TrialVerdict.Eliminated,
        votes: [],
      },
      pendingGuiltId,
    },
    deadPlayerIds,
  };
}

describe("WerewolfAction.AdvanceMartyrWindow", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.AdvanceMartyrWindow];

  describe("isValid", () => {
    it("returns true for narrator when pendingGuiltId is set", () => {
      const game = makePlayingGame(makeDayStateWithPendingGuilt("p2"));
      expect(action.isValid(game, "owner-1", {})).toBe(true);
    });

    it("returns false when pendingGuiltId is not set", () => {
      const ts: WerewolfTurnState = {
        turn: 1,
        phase: {
          type: WerewolfPhase.Daytime,
          startedAt: 1000,
          nightActions: {},
        },
        deadPlayerIds: [],
      };
      const game = makePlayingGame(ts);
      expect(action.isValid(game, "owner-1", {})).toBe(false);
    });

    it("returns false for non-narrator player", () => {
      const game = makePlayingGame(makeDayStateWithPendingGuilt("p2"));
      expect(action.isValid(game, "p2", {})).toBe(false);
    });

    it("returns false during nighttime phase", () => {
      const ts: WerewolfTurnState = {
        turn: 1,
        phase: {
          type: WerewolfPhase.Nighttime,
          startedAt: 1000,
          nightPhaseOrder: [],
          currentPhaseIndex: 0,
          nightActions: {},
        },
        deadPlayerIds: [],
      };
      const game = makePlayingGame(ts);
      expect(action.isValid(game, "owner-1", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("adds the convicted player to deadPlayerIds", () => {
      const game = makePlayingGame(makeDayStateWithPendingGuilt("p2"));
      action.apply(game, {}, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).toContain("p2");
    });

    it("clears pendingGuiltId after applying death", () => {
      const game = makePlayingGame(makeDayStateWithPendingGuilt("p2"));
      action.apply(game, {}, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as { pendingGuiltId?: string };
      expect(phase.pendingGuiltId).toBeUndefined();
    });

    it("Werewolves win when last non-Bad player is eliminated", () => {
      const game = makePlayingGame(makeDayStateWithPendingGuilt("p2"), {
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
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Finished);
      expect((game.status as { winner?: string }).winner).toBe(
        WerewolfWinner.Werewolves,
      );
    });

    it("Village wins when last Bad player is eliminated", () => {
      const game = makePlayingGame(makeDayStateWithPendingGuilt("p1"), {
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
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Finished);
      expect((game.status as { winner?: string }).winner).toBe(
        WerewolfWinner.Village,
      );
    });

    it("does not end game when elimination does not trigger win condition", () => {
      const game = makePlayingGame(makeDayStateWithPendingGuilt("p2"));
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
    });

    it("clears One-Eyed Seer lock when locked target is eliminated", () => {
      const ts = makeDayStateWithPendingGuilt("p3");
      ts.oneEyedSeerLockedTargetId = "p3";
      const game = makePlayingGame(ts);
      action.apply(game, {}, "owner-1");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.oneEyedSeerLockedTargetId).toBeUndefined();
    });

    it("consumes priest ward when warded player is eliminated", () => {
      const ts = makeDayStateWithPendingGuilt("p3");
      ts.priestWards = { p3: "p2", p4: "p2" };
      const game = makePlayingGame(ts);
      action.apply(game, {}, "owner-1");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.priestWards).toEqual({ p4: "p2" });
    });

    it("sets hunterRevengePlayerId when Hunter is eliminated", () => {
      const game = makePlayingGame(makeDayStateWithPendingGuilt("p2"), {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.hunterRevengePlayerId).toBe("p2");
      expect(ts.deadPlayerIds).toContain("p2");
    });

    it("defers win condition when Hunter is eliminated (would otherwise trigger win)", () => {
      const game = makePlayingGame(makeDayStateWithPendingGuilt("p2"), {
        players: [
          { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
          { id: "p2", name: "Hunter", sessionId: "s2", visiblePlayers: [] },
          { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.hunterRevengePlayerId).toBe("p2");
    });

    it("Tanner wins when eliminated via AdvanceMartyrWindow", () => {
      const game = makePlayingGame(makeDayStateWithPendingGuilt("p3"), {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Tanner },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Finished);
      expect((game.status as { winner?: string }).winner).toBe(
        WerewolfWinner.Tanner,
      );
    });

    it("Tanner win is blocked when Martyr takes Tanner's elimination", () => {
      // The Martyr uses their ability (UseMartyrAbility) before this action runs,
      // clearing pendingGuiltId so this action never fires for the Tanner.
      // This test verifies Tanner does NOT win when pendingGuiltId is a different player.
      const game = makePlayingGame(makeDayStateWithPendingGuilt("p2"), {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Tanner },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
    });

    it("Executioner wins when their target is eliminated", () => {
      const ts = makeDayStateWithPendingGuilt("p2");
      ts.executionerTargetId = "p2";
      const game = makePlayingGame(ts, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Executioner },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Finished);
      expect((game.status as { winner?: string }).winner).toBe(
        WerewolfWinner.Executioner,
      );
    });

    it("non-target player eliminated does not trigger Executioner win", () => {
      const ts = makeDayStateWithPendingGuilt("p4");
      ts.executionerTargetId = "p2";
      const game = makePlayingGame(ts, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Executioner },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
    });

    it("sets wolfCubDied when Wolf Cub is eliminated", () => {
      const ts = makeDayStateWithPendingGuilt("p2");
      const game = makePlayingGame(ts, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.WolfCub },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "owner-1");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.wolfCubDied).toBe(true);
    });
  });
});
