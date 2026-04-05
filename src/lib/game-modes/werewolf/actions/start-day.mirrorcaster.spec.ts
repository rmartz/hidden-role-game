import { describe, it, expect } from "vitest";
import type { Game } from "@/lib/types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame, makeNightState } from "./test-helpers";

const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

const mcRoleAssignments = [
  { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
  { playerId: "p2", roleDefinitionId: WerewolfRole.Mirrorcaster },
  { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
];

function getTurnState(game: Game): WerewolfTurnState {
  return (game.status as { turnState: WerewolfTurnState }).turnState;
}

describe("WerewolfAction.StartDay — Mirrorcaster charge tracking", () => {
  it("gains a charge when protection blocks an attack", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p3",
          },
          [WerewolfRole.Mirrorcaster]: { targetPlayerId: "p3" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Mirrorcaster],
      }),
      { roleAssignments: mcRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.mirrorcasterCharged).toBe(true);
    expect(ts.deadPlayerIds).not.toContain("p3");
  });

  it("does not gain a charge when protection target is not attacked", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p4",
          },
          [WerewolfRole.Mirrorcaster]: { targetPlayerId: "p3" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Mirrorcaster],
      }),
      { roleAssignments: mcRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.mirrorcasterCharged).toBeUndefined();
  });

  it("charge is consumed when attack is used", () => {
    const baseState = makeNightState({
      nightActions: {
        [WerewolfRole.Mirrorcaster]: { targetPlayerId: "p3" },
      },
      nightPhaseOrder: [WerewolfRole.Mirrorcaster],
    });
    const game = makePlayingGame(
      { ...baseState, mirrorcasterCharged: true },
      { roleAssignments: mcRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.mirrorcasterCharged).toBeUndefined();
  });

  it("charge persists when Mirrorcaster skips their attack", () => {
    const baseState = makeNightState({
      nightActions: {},
      nightPhaseOrder: [WerewolfRole.Mirrorcaster],
    });
    const game = makePlayingGame(
      { ...baseState, mirrorcasterCharged: true },
      { roleAssignments: mcRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.mirrorcasterCharged).toBe(true);
  });

  it("charged Mirrorcaster attack kills unprotected target", () => {
    const baseState = makeNightState({
      nightActions: {
        [WerewolfRole.Mirrorcaster]: { targetPlayerId: "p3" },
      },
      nightPhaseOrder: [WerewolfRole.Mirrorcaster],
    });
    const game = makePlayingGame(
      { ...baseState, mirrorcasterCharged: true },
      { roleAssignments: mcRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.deadPlayerIds).toContain("p3");
    expect(ts.mirrorcasterCharged).toBeUndefined();
  });
});
