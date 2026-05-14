import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../roles";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import type { Game } from "@/lib/types";
import { WEREWOLF_ACTIONS, WerewolfAction } from "./index";
import { makePlayingGame, makeNightState } from "./test-helpers";

const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

function getTurnState(game: Game): WerewolfTurnState {
  return (game.status as { turnState: WerewolfTurnState }).turnState;
}

const mercRoleAssignments = [
  { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
  { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
  { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
];

describe("WerewolfAction.StartDay — Mercenary charge tracking", () => {
  it("gains a charge when protection blocks an attack", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p3",
          },
          [WerewolfRole.Mercenary]: { targetPlayerId: "p3" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Mercenary],
      }),
      { roleAssignments: mercRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.roleState?.mercenary?.charged).toBe(true);
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
          [WerewolfRole.Mercenary]: { targetPlayerId: "p3" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Mercenary],
      }),
      { roleAssignments: mercRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.roleState?.mercenary?.charged).toBeUndefined();
  });

  it("does not gain a charge when Mercenary has no target", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p3",
          },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Mercenary],
      }),
      { roleAssignments: mercRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.roleState?.mercenary?.charged).toBeUndefined();
    expect(ts.deadPlayerIds).toContain("p3");
  });
});

describe("WerewolfAction.StartDay — Mercenary bribe tracking", () => {
  it("bribe target is appended and charge is cleared when charged and bribe submitted", () => {
    const baseState = makeNightState({
      nightActions: {
        [WerewolfRole.Mercenary]: { targetPlayerId: "p4" },
      },
      nightPhaseOrder: [WerewolfRole.Mercenary],
    });
    const game = makePlayingGame(
      {
        ...baseState,
        roleState: { mercenary: { charged: true, bribedPlayerIds: [] } },
      },
      { roleAssignments: mercRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.roleState?.mercenary?.charged).not.toBe(true);
    expect(ts.roleState?.mercenary?.bribedPlayerIds).toContain("p4");
  });

  it("charge persists when charged but Mercenary skips bribe", () => {
    const baseState = makeNightState({
      nightActions: {},
      nightPhaseOrder: [WerewolfRole.Mercenary],
    });
    const game = makePlayingGame(
      {
        ...baseState,
        roleState: { mercenary: { charged: true, bribedPlayerIds: [] } },
      },
      { roleAssignments: mercRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.roleState?.mercenary?.charged).toBe(true);
    expect(ts.roleState?.mercenary?.bribedPlayerIds).toEqual([]);
  });

  it("accumulates bribed player IDs across multiple nights", () => {
    const baseState = makeNightState({
      nightActions: {
        [WerewolfRole.Mercenary]: { targetPlayerId: "p5" },
      },
      nightPhaseOrder: [WerewolfRole.Mercenary],
    });
    const game = makePlayingGame(
      {
        ...baseState,
        roleState: { mercenary: { charged: true, bribedPlayerIds: ["p3"] } },
      },
      { roleAssignments: mercRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.roleState?.mercenary?.bribedPlayerIds).toContain("p3");
    expect(ts.roleState?.mercenary?.bribedPlayerIds).toContain("p5");
    expect(ts.roleState?.mercenary?.charged).not.toBe(true);
  });

  it("does not duplicate bribed player IDs when same player is bribed again", () => {
    const baseState = makeNightState({
      nightActions: {
        [WerewolfRole.Mercenary]: { targetPlayerId: "p3" },
      },
      nightPhaseOrder: [WerewolfRole.Mercenary],
    });
    const game = makePlayingGame(
      {
        ...baseState,
        roleState: { mercenary: { charged: true, bribedPlayerIds: ["p3"] } },
      },
      { roleAssignments: mercRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.roleState?.mercenary?.bribedPlayerIds).toEqual(["p3"]);
    expect(ts.roleState?.mercenary?.charged).not.toBe(true);
  });

  it("protect mode does not interact with bribed player IDs", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p3" },
          [WerewolfRole.Mercenary]: { targetPlayerId: "p3" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Mercenary],
      }),
      {
        roleAssignments: mercRoleAssignments,
      },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    // Charge gained but bribed list stays empty (protect ≠ bribe)
    expect(ts.roleState?.mercenary?.charged).toBe(true);
    expect(ts.roleState?.mercenary?.bribedPlayerIds).toEqual([]);
  });
});

describe("WerewolfAction.StartDay — Mercenary protect mode resolution", () => {
  it("protected player survives a werewolf attack", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p3" },
          [WerewolfRole.Mercenary]: { targetPlayerId: "p3" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Mercenary],
      }),
      { roleAssignments: mercRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.deadPlayerIds).not.toContain("p3");
  });

  it("unprotected player dies from a werewolf attack", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p3" },
          [WerewolfRole.Mercenary]: { targetPlayerId: "p4" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Mercenary],
      }),
      { roleAssignments: mercRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.deadPlayerIds).toContain("p3");
  });

  it("Mercenary in bribe mode does not protect the target", () => {
    const baseState = makeNightState({
      nightActions: {
        [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p3" },
        [WerewolfRole.Mercenary]: { targetPlayerId: "p3" },
      },
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Mercenary],
    });
    const game = makePlayingGame(
      {
        ...baseState,
        roleState: { mercenary: { charged: true, bribedPlayerIds: [] } },
      },
      { roleAssignments: mercRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    // p3 is bribed but NOT protected — they should die
    const ts = getTurnState(game);
    expect(ts.deadPlayerIds).toContain("p3");
    // p3 is bribed
    expect(ts.roleState?.mercenary?.bribedPlayerIds).toContain("p3");
  });
});

describe("WerewolfAction.StartDay — turn phase after mercenary", () => {
  it("day phase type is set after start-day with mercenary", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {},
        nightPhaseOrder: [WerewolfRole.Mercenary],
      }),
      { roleAssignments: mercRoleAssignments },
    );

    action.apply(game, null, "owner-1");

    const ts = getTurnState(game);
    expect(ts.phase.type).toBe(WerewolfPhase.Daytime);
  });
});
