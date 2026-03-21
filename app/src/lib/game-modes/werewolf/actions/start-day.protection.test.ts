import { describe, it, expect } from "vitest";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame, makeNightState } from "./test-helpers";

// ---------------------------------------------------------------------------
// StartDay — Protection role integration tests
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartDay — protections", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

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
