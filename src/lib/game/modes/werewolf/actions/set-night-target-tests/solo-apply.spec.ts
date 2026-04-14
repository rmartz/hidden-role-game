import { describe, it, expect } from "vitest";
import type { WerewolfTurnState, WerewolfNighttimePhase } from "../../types";
import { WerewolfRole } from "../../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../index";
import {
  makePlayingGame,
  makeNightState,
  nightTurn2State,
} from "../test-helpers";

// ---------------------------------------------------------------------------
// SetNightTarget — solo role apply
// ---------------------------------------------------------------------------

describe("WerewolfAction.SetNightTarget", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

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

    describe("Mentalist target exclusivity", () => {
      it("clears both selected players when switching to no target", () => {
        const game = makePlayingGame(
          makeNightState({
            turn: 2,
            nightPhaseOrder: [WerewolfRole.Mentalist],
            currentPhaseIndex: 0,
            nightActions: {
              [WerewolfRole.Mentalist]: {
                targetPlayerId: "p1",
                secondTargetPlayerId: "p3",
              },
            },
          }),
          {
            roleAssignments: [
              { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
              { playerId: "p2", roleDefinitionId: WerewolfRole.Mentalist },
              { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
              { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
              { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
            ],
          },
        );
        action.apply(game, { targetPlayerId: null }, "p2");
        const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
        const phase = ts.phase as WerewolfNighttimePhase;
        expect(phase.nightActions[WerewolfRole.Mentalist]).toEqual({
          skipped: true,
        });
      });

      it("replaces no-target selection when choosing a player", () => {
        const game = makePlayingGame(
          makeNightState({
            turn: 2,
            nightPhaseOrder: [WerewolfRole.Mentalist],
            currentPhaseIndex: 0,
            nightActions: {
              [WerewolfRole.Mentalist]: {
                skipped: true,
              },
            },
          }),
          {
            roleAssignments: [
              { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
              { playerId: "p2", roleDefinitionId: WerewolfRole.Mentalist },
              { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
              { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
              { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
            ],
          },
        );
        action.apply(game, { targetPlayerId: "p1" }, "p2");
        const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
        const phase = ts.phase as WerewolfNighttimePhase;
        expect(phase.nightActions[WerewolfRole.Mentalist]).toEqual({
          targetPlayerId: "p1",
        });
      });
    });
  });
});
