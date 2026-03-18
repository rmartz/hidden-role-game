import { describe, it, expect } from "vitest";
import type { WerewolfTurnState } from "../types";
import { WerewolfPhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import {
  makePlayingGame,
  makeNightState,
  nightTurnState,
  dayTurnState,
} from "./test-helpers";

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
            [WerewolfRole.Werewolf]: {
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
            [WerewolfRole.Werewolf]: {
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
            [WerewolfRole.Werewolf]: {
              votes: [],
              suggestedTargetId: "p2",
            },
          },
        }),
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as import("../types").WerewolfDaytimePhase;
      expect(phase.nightResolution).toBeDefined();
      expect(phase.nightResolution).toHaveLength(1);
      expect(phase.nightResolution![0]).toMatchObject({
        type: "killed",
        targetPlayerId: "p2",
        died: true,
      });
    });

    it("omits nightResolution when there are no night actions", () => {
      const game = makePlayingGame(nightTurnState);
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as import("../types").WerewolfDaytimePhase;
      expect(phase.nightResolution).toBeUndefined();
    });

    it("Doctor protection saves a player through the full start-day flow", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [],
              suggestedTargetId: "p2",
            },
            [WerewolfRole.Doctor]: { targetPlayerId: "p2" },
          },
          nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Doctor],
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Doctor },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).not.toContain("p2");
    });

    it("Priest ward is created from night action and protects on the same night", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [],
              suggestedTargetId: "p2",
            },
            [WerewolfRole.Priest]: { targetPlayerId: "p2" },
          },
          nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Priest],
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Priest },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).not.toContain("p2");
    });

    it("Priest ward persists to next turn when warded player is NOT attacked", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [],
              suggestedTargetId: "p4",
            },
            [WerewolfRole.Priest]: { targetPlayerId: "p2" },
          },
          nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Priest],
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Priest },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.priestWards).toEqual({ p2: "p3" });
    });

    it("Priest ward is consumed when warded player IS attacked", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [],
              suggestedTargetId: "p2",
            },
            [WerewolfRole.Priest]: { targetPlayerId: "p2" },
          },
          nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Priest],
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Priest },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.priestWards).toBeUndefined();
      expect(ts.deadPlayerIds).not.toContain("p2");
    });

    it("Tough Guy survives first attack, toughGuyHitIds is populated", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [],
              suggestedTargetId: "p2",
            },
          },
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.ToughGuy },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).not.toContain("p2");
      expect(ts.toughGuyHitIds).toContain("p2");
    });

    it("Tough Guy dies on second attack when toughGuyHitIds already contains them", () => {
      const nightState = makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
        },
      });
      nightState.toughGuyHitIds = ["p2"];
      const game = makePlayingGame(nightState, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.ToughGuy },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).toContain("p2");
    });
  });
});
