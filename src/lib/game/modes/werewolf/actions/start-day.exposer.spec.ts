import { describe, it, expect } from "vitest";
import type { Game } from "@/lib/types";
import type { WerewolfTurnState, WerewolfDaytimePhase } from "../types";
import { WerewolfPhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame, makeNightState } from "./test-helpers";

const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];
const startNight = WEREWOLF_ACTIONS[WerewolfAction.StartNight];

const exposerRoleAssignments = [
  { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
  { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
  { playerId: "p3", roleDefinitionId: WerewolfRole.Exposer },
  { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
];

function getTurnState(game: Game): WerewolfTurnState {
  return (game.status as { turnState: WerewolfTurnState }).turnState;
}

describe("WerewolfAction.StartDay — Exposer reveal placement", () => {
  it("sets phase.exposerReveal on the day after the exposure", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Exposer]: {
            targetPlayerId: "p2",
            confirmed: true,
          },
        },
        nightPhaseOrder: [WerewolfRole.Exposer],
      }),
      { roleAssignments: exposerRoleAssignments },
    );

    startDay.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    const phase = ts.phase as WerewolfDaytimePhase;
    expect(phase.exposerReveal).toEqual({
      playerId: "p2",
      roleId: WerewolfRole.Seer,
    });
  });

  it("does not re-set phase.exposerReveal on subsequent days", () => {
    // Night 1: Exposer reveals p2's role.
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Exposer]: {
            targetPlayerId: "p2",
            confirmed: true,
          },
        },
        nightPhaseOrder: [WerewolfRole.Exposer],
      }),
      { roleAssignments: exposerRoleAssignments },
    );

    startDay.apply(game, null, "owner-1");
    const dayOnePhase = getTurnState(game).phase as WerewolfDaytimePhase;
    expect(dayOnePhase.exposerReveal).toBeDefined();

    // Advance day 1 → night 2 → day 2 without another Exposer action.
    startNight.apply(game, null, "owner-1");
    startDay.apply(game, null, "owner-1");

    const dayTwoTs = getTurnState(game);
    expect(dayTwoTs.turn).toBe(2);
    expect(dayTwoTs.phase.type).toBe(WerewolfPhase.Daytime);
    const dayTwoPhase = dayTwoTs.phase as WerewolfDaytimePhase;
    expect(dayTwoPhase.exposerReveal).toBeUndefined();
  });
});
