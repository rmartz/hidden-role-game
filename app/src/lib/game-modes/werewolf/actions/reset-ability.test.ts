import { describe, it, expect } from "vitest";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame, makeNightState } from "./test-helpers";

describe("WerewolfAction.ResetAbility", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.ResetAbility];

  it("resets witchAbilityUsed", () => {
    const ns = makeNightState({ turn: 2 });
    ns.witchAbilityUsed = true;
    const game = makePlayingGame(ns);
    action.apply(game, { roleId: WerewolfRole.Witch }, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.witchAbilityUsed).toBeUndefined();
  });

  it("resets exposerAbilityUsed", () => {
    const ns = makeNightState({ turn: 2 });
    ns.exposerAbilityUsed = true;
    const game = makePlayingGame(ns);
    action.apply(game, { roleId: WerewolfRole.Exposer }, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.exposerAbilityUsed).toBeUndefined();
  });

  it("isValid returns true for known ability role", () => {
    const game = makePlayingGame(makeNightState({ turn: 2 }));
    expect(
      action.isValid(game, "owner-1", { roleId: WerewolfRole.Witch }),
    ).toBe(true);
  });

  it("isValid returns false for unknown role", () => {
    const game = makePlayingGame(makeNightState({ turn: 2 }));
    expect(action.isValid(game, "owner-1", { roleId: WerewolfRole.Seer })).toBe(
      false,
    );
  });

  it("isValid returns false for non-owner", () => {
    const game = makePlayingGame(makeNightState({ turn: 2 }));
    expect(action.isValid(game, "p2", { roleId: WerewolfRole.Witch })).toBe(
      false,
    );
  });
});

describe("Narrator bypasses once-per-game restrictions in SetNightTarget", () => {
  const setTarget = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  it("narrator can set Witch target even when witchAbilityUsed", () => {
    const ns = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Witch],
    });
    ns.witchAbilityUsed = true;
    const game = makePlayingGame(ns, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Witch },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    expect(
      setTarget.isValid(game, "owner-1", {
        roleId: WerewolfRole.Witch,
        targetPlayerId: "p3",
      }),
    ).toBe(true);
  });

  it("player cannot set Witch target when witchAbilityUsed", () => {
    const ns = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Witch],
      currentPhaseIndex: 0,
    });
    ns.witchAbilityUsed = true;
    const game = makePlayingGame(ns, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Witch },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    expect(setTarget.isValid(game, "p2", { targetPlayerId: "p3" })).toBe(false);
  });
});
