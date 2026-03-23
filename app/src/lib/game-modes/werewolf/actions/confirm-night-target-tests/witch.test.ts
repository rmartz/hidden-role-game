import { describe, it, expect } from "vitest";
import type { WerewolfTurnState } from "../../types";
import { WerewolfPhase } from "../../types";
import { WerewolfRole } from "../../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../index";
import { makePlayingGame } from "../test-helpers";

// ---------------------------------------------------------------------------
// ConfirmNightTarget — Witch witchAbilityUsed
// ---------------------------------------------------------------------------

describe("ConfirmNightTarget — sets witchAbilityUsed for Witch", () => {
  const confirmAction = WEREWOLF_ACTIONS[WerewolfAction.ConfirmNightTarget];
  const setTargetAction = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  it("sets witchAbilityUsed after start-day resolves the Witch's action", () => {
    const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];
    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Nighttime,
        startedAt: 1000,
        nightPhaseOrder: [WerewolfRole.Witch],
        currentPhaseIndex: 0,
        nightActions: {},
      },
      deadPlayerIds: [],
    };
    const game = makePlayingGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Witch },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });

    setTargetAction.apply(game, { targetPlayerId: "p3" }, "p1");
    confirmAction.apply(game, null, "p1");
    startDay.apply(game, null, "owner-1");

    const resultTs = (game.status as { turnState: WerewolfTurnState })
      .turnState;
    expect(resultTs.witchAbilityUsed).toBe(true);
  });

  it("witchAbilityUsed is carried forward into the next night", () => {
    const startNight = WEREWOLF_ACTIONS[WerewolfAction.StartNight];
    const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Nighttime,
        startedAt: 1000,
        nightPhaseOrder: [WerewolfRole.Witch],
        currentPhaseIndex: 0,
        nightActions: {
          [WerewolfRole.Witch]: { targetPlayerId: "p2", confirmed: true },
        },
      },
      deadPlayerIds: [],
      witchAbilityUsed: true,
    };
    // Werewolf added to prevent Village win after Witch kills p2
    const game = makePlayingGame(ts, {
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
        { id: "p4", name: "Dan", sessionId: "s4", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Witch },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Werewolf },
      ],
    });

    startDay.apply(game, null, "owner-1");
    startNight.apply(game, null, "owner-1");

    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.witchAbilityUsed).toBe(true);
  });
});
