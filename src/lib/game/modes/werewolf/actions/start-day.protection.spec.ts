import { describe, it, expect } from "vitest";
import type { WerewolfTurnState } from "../types";
import { WerewolfPhase } from "../types";
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

  it("Monarch survives a normal night attack while a Knighted player is alive", () => {
    const nightState = makeNightState({
      nightActions: {
        [WerewolfRole.Werewolf]: {
          votes: [],
          suggestedTargetId: "p2",
        },
      },
      nightPhaseOrder: [WerewolfRole.Werewolf],
    });
    nightState.monarchKnightedPlayerIds = ["p3"];
    nightState.monarchKnightingsUsed = 1;
    const game = makePlayingGame(nightState, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Monarch },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).not.toContain("p2");
  });

  it("Altruist does not intercept an attack on a Monarch protected by a living Knighted player", () => {
    const nightState = makeNightState({
      nightActions: {
        [WerewolfRole.Werewolf]: {
          votes: [],
          suggestedTargetId: "p2",
        },
        [WerewolfRole.Altruist]: { targetPlayerId: "p2" },
      },
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Altruist],
    });
    nightState.monarchKnightedPlayerIds = ["p4"];
    nightState.monarchKnightingsUsed = 1;
    const game = makePlayingGame(nightState, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Monarch },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Altruist },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Seer },
      ],
    });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).not.toContain("p2");
    expect(ts.deadPlayerIds).not.toContain("p3");
    if (ts.phase.type === WerewolfPhase.Daytime) {
      expect(
        ts.phase.nightResolution?.find(
          (event) => event.type === "altruist-intercepted",
        ),
      ).toBeUndefined();
    }
  });

  it("Monarch is not protected against Bad attackers when all living Knighted players are Bad", () => {
    const nightState = makeNightState({
      nightActions: {
        [WerewolfRole.Werewolf]: {
          votes: [],
          suggestedTargetId: "p2",
        },
      },
      nightPhaseOrder: [WerewolfRole.Werewolf],
    });
    nightState.monarchKnightedPlayerIds = ["p1"];
    nightState.monarchKnightingsUsed = 1;
    const game = makePlayingGame(nightState, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Monarch },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p2");
  });

  it("Monarch remains protected when multiple Werewolves attack and no Knighted attacker exception applies", () => {
    const nightState = makeNightState({
      nightActions: {
        [WerewolfRole.Werewolf]: {
          votes: [
            { playerId: "p1", targetPlayerId: "p2" },
            { playerId: "p4", targetPlayerId: "p2" },
          ],
          suggestedTargetId: "p2",
        },
      },
      nightPhaseOrder: [WerewolfRole.Werewolf],
    });
    nightState.monarchKnightedPlayerIds = ["p3"];
    nightState.monarchKnightingsUsed = 1;
    const game = makePlayingGame(nightState, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Monarch },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).not.toContain("p2");
  });

  it("Monarch is not protected when the only living Knighted player is the attacker", () => {
    const nightState = makeNightState({
      nightActions: {
        [WerewolfRole.Mortician]: { targetPlayerId: "p2" },
      },
      nightPhaseOrder: [WerewolfRole.Mortician],
    });
    nightState.monarchKnightedPlayerIds = ["p3"];
    nightState.monarchKnightingsUsed = 1;
    const game = makePlayingGame(nightState, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Monarch },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Mortician },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p2");
  });

  it("Monarch knighting count increases even if the newly knighted player dies", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p3",
          },
          [WerewolfRole.Monarch]: { targetPlayerId: "p3" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Monarch],
      }),
      {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Monarch },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      },
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.monarchKnightedPlayerIds).toContain("p3");
    expect(ts.monarchKnightingsUsed).toBe(1);
    expect(ts.deadPlayerIds).toContain("p3");
  });

  it("Monarch re-knighting an already knighted player does not consume a charge", () => {
    const nightState = makeNightState({
      nightActions: {
        [WerewolfRole.Werewolf]: {
          votes: [],
          suggestedTargetId: "p5",
        },
        [WerewolfRole.Monarch]: { targetPlayerId: "p3" },
      },
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Monarch],
    });
    nightState.monarchKnightedPlayerIds = ["p3"];
    nightState.monarchKnightingsUsed = 1;

    const game = makePlayingGame(nightState, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Monarch },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });

    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.monarchKnightedPlayerIds).toEqual(["p3"]);
    expect(ts.monarchKnightingsUsed).toBe(1);
    expect(ts.phase.type).toBe(WerewolfPhase.Daytime);
    if (ts.phase.type === WerewolfPhase.Daytime) {
      expect(ts.phase.knightedPlayerId).toBeUndefined();
    }
  });
});
