import { describe, expect, it } from "vitest";

import { WerewolfRole } from "../roles";
import type { WerewolfTurnState } from "../types";
import { WEREWOLF_ACTIONS, WerewolfAction } from "./index";
import { makeNightState, makePlayingGame } from "./test-helpers";

// ---------------------------------------------------------------------------
// StartDay — Evil Empath
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartDay — Evil Empath night-death reveal", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("carries revealedResult into daytime roleState when Evil Empath dies overnight", () => {
    const nightState = makeNightState({
      nightActions: {
        [WerewolfRole.Werewolf]: {
          votes: [],
          suggestedTargetId: "p3",
        },
      },
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
    });
    // Evil Empath has a lastResult from a previous night check.
    nightState.roleState = { evilEmpath: { lastResult: true } };
    const game = makePlayingGame(nightState, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p3", roleDefinitionId: WerewolfRole.EvilEmpath },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p3");
    expect(ts.roleState?.evilEmpath?.revealedResult).toBe(true);
  });
});
