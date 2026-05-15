import { describe, expect, it } from "vitest";

import type { Game } from "@/lib/types";

import { WerewolfRole } from "../roles";
import type { WerewolfTurnState } from "../types";
import { WEREWOLF_ACTIONS, WerewolfAction } from "./index";
import { makeNightState, makePlayingGame } from "./test-helpers";

const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

const veteranRoleAssignments = [
  { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
  { playerId: "p2", roleDefinitionId: WerewolfRole.Veteran },
  { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
];

function getTurnState(game: Game): WerewolfTurnState {
  return (game.status as { turnState: WerewolfTurnState }).turnState;
}

describe("WerewolfAction.StartDay — veteranAlertsUsed tracking", () => {
  it("increments veteranAlertsUsed by 1 when the Veteran alerts", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Veteran]: { alerted: true },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Veteran],
      }),
      { roleAssignments: veteranRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.roleState?.veteran?.alertsUsed).toBe(1);
  });

  it("does not increment veteranAlertsUsed when the Veteran stays home", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Veteran]: { skipped: true },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Veteran],
      }),
      { roleAssignments: veteranRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.roleState?.veteran?.alertsUsed ?? 0).toBe(0);
  });

  it("does not increment veteranAlertsUsed when there is no Veteran action", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {},
        nightPhaseOrder: [WerewolfRole.Werewolf],
      }),
      { roleAssignments: veteranRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.roleState?.veteran?.alertsUsed ?? 0).toBe(0);
  });

  it("accumulates veteranAlertsUsed across multiple alert nights", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Veteran]: { alerted: true },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Veteran],
      }),
      { roleAssignments: veteranRoleAssignments },
    );
    // Simulate 1 prior alert already used.
    (game.status as { turnState: WerewolfTurnState }).turnState.roleState = {
      veteran: { alertsUsed: 1 },
    };

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.roleState?.veteran?.alertsUsed).toBe(2);
  });
});
