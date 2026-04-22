import { describe, it, expect } from "vitest";
import type { Game } from "@/lib/types";
import type { WerewolfTurnState, WerewolfNighttimePhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame, makeNightState } from "./test-helpers";

// ---------------------------------------------------------------------------
// RevealInvestigationResult
// ---------------------------------------------------------------------------

describe("RevealInvestigationResult", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.RevealInvestigationResult];

  const seerNightPhaseOrder = [WerewolfRole.Seer];

  function makeSeerGame(nightState: WerewolfTurnState): Game {
    return makePlayingGame(nightState, {
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
  }

  it("is valid when Seer has confirmed an investigation", () => {
    const game = makeSeerGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: seerNightPhaseOrder,
        nightActions: {
          [WerewolfRole.Seer]: { targetPlayerId: "p2", confirmed: true },
        },
      }),
    );
    expect(action.isValid(game, "owner-1", null)).toBe(true);
  });

  it("is invalid when action is not confirmed", () => {
    const game = makeSeerGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: seerNightPhaseOrder,
        nightActions: {
          [WerewolfRole.Seer]: { targetPlayerId: "p2" },
        },
      }),
    );
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("is invalid when result is already revealed", () => {
    const game = makeSeerGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: seerNightPhaseOrder,
        nightActions: {
          [WerewolfRole.Seer]: {
            targetPlayerId: "p2",
            confirmed: true,
            resultRevealed: true,
          },
        },
      }),
    );
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("is invalid when active phase is not an Investigate role", () => {
    const game = makePlayingGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: [WerewolfRole.Bodyguard],
        nightActions: {
          [WerewolfRole.Bodyguard]: { targetPlayerId: "p3", confirmed: true },
        },
      }),
      {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Bodyguard },
        ],
      },
    );
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("is invalid for non-owner callers", () => {
    const game = makeSeerGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: seerNightPhaseOrder,
        nightActions: {
          [WerewolfRole.Seer]: { targetPlayerId: "p2", confirmed: true },
        },
      }),
    );
    expect(action.isValid(game, "p1", null)).toBe(false);
  });

  it("apply sets resultRevealed to true", () => {
    const game = makeSeerGame(
      makeNightState({
        turn: 2,
        nightPhaseOrder: seerNightPhaseOrder,
        nightActions: {
          [WerewolfRole.Seer]: { targetPlayerId: "p2", confirmed: true },
        },
      }),
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    expect(phase.nightActions[WerewolfRole.Seer]).toMatchObject({
      targetPlayerId: "p2",
      confirmed: true,
      resultRevealed: true,
    });
  });
});

// ---------------------------------------------------------------------------
// RevealInvestigationResult — Illuminati (revealsFullRoleList)
// ---------------------------------------------------------------------------

describe("RevealInvestigationResult (Illuminati)", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.RevealInvestigationResult];

  const illuminatiNightPhaseOrder = [WerewolfRole.Illuminati];

  function makeIlluminatiGame(nightState: WerewolfTurnState): Game {
    return makePlayingGame(nightState, {
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Illuminati },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
  }

  it("is valid for Illuminati when no action exists yet", () => {
    const game = makeIlluminatiGame(
      makeNightState({
        turn: 1,
        nightPhaseOrder: illuminatiNightPhaseOrder,
        nightActions: {},
      }),
    );
    expect(action.isValid(game, "owner-1", null)).toBe(true);
  });

  it("is invalid for Illuminati when result is already revealed", () => {
    const game = makeIlluminatiGame(
      makeNightState({
        turn: 1,
        nightPhaseOrder: illuminatiNightPhaseOrder,
        nightActions: {
          [WerewolfRole.Illuminati]: { resultRevealed: true },
        },
      }),
    );
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("apply creates a resultRevealed action for Illuminati with no prior action", () => {
    const game = makeIlluminatiGame(
      makeNightState({
        turn: 1,
        nightPhaseOrder: illuminatiNightPhaseOrder,
        nightActions: {},
      }),
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    expect(phase.nightActions[WerewolfRole.Illuminati]).toMatchObject({
      resultRevealed: true,
    });
  });
});
