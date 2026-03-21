import { describe, it, expect } from "vitest";
import type { Game } from "@/lib/types";
import type { WerewolfTurnState, AnyNightAction } from "../../types";
import { WerewolfPhase } from "../../types";
import { WerewolfRole } from "../../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../index";
import { resolveNightActions } from "../../utils";
import { makePlayingGame, makeNightState, makeTeamGame } from "../test-helpers";

// ---------------------------------------------------------------------------
// Bodyguard self-targeting
// ---------------------------------------------------------------------------

describe("SetNightTarget — Bodyguard self-targeting", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  function makeBodyguardGame(nightState: WerewolfTurnState): Game {
    return makePlayingGame(nightState, {
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Bodyguard },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
  }

  const bodyguardNightState = makeNightState({
    turn: 2,
    nightPhaseOrder: [WerewolfRole.Bodyguard],
  });

  const nightTurn2State = makeNightState({ turn: 2 });

  it("Bodyguard can target themselves", () => {
    const game = makeBodyguardGame(bodyguardNightState);
    expect(action.isValid(game, "p1", { targetPlayerId: "p1" })).toBe(true);
  });

  it("Attack role cannot target themselves", () => {
    const game = makePlayingGame(nightTurn2State);
    expect(action.isValid(game, "p1", { targetPlayerId: "p1" })).toBe(false);
  });

  it("Bodyguard self-protection is applied by resolveNightActions", () => {
    const assignments = [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Bodyguard },
    ];
    const nightActions = {
      [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p2" },
      [WerewolfRole.Bodyguard]: { targetPlayerId: "p2" },
    };
    const events = resolveNightActions(nightActions, assignments, []);
    const event = events.find(
      (e) => e.type === "killed" && e.targetPlayerId === "p2",
    );
    expect(event).toMatchObject({ died: false });
  });
});

// ---------------------------------------------------------------------------
// Witch ability
// ---------------------------------------------------------------------------

describe("SetNightTarget — Witch once-per-game restriction", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  function makeWitchGame(witchAbilityUsed = false) {
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
      ...(witchAbilityUsed ? { witchAbilityUsed: true } : {}),
    };
    return makePlayingGame(ts, {
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Witch },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
  }

  it("Witch can set target when ability not yet used", () => {
    const game = makeWitchGame(false);
    expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(true);
  });

  it("Witch cannot set target when ability already used", () => {
    const game = makeWitchGame(true);
    expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Suffixed repeat group phase (Wolf Cub bonus)
// ---------------------------------------------------------------------------

const WOLF_CUB_BONUS_PHASE_KEY = `${WerewolfRole.Werewolf as string}:2`;

function makeWolfCubBonusGame(
  nightActions: Record<string, AnyNightAction> = {},
): Game {
  return makeTeamGame({
    turn: 2,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf, WOLF_CUB_BONUS_PHASE_KEY],
      currentPhaseIndex: 1,
      nightActions,
    },
    deadPlayerIds: [],
  });
}

describe("SetNightTarget — suffixed repeat group phase", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  it("rejects targeting the same player as the first phase's suggestedTargetId", () => {
    const game = makeWolfCubBonusGame({
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
    });
    expect(action.isValid(game, "w1", { targetPlayerId: "p3" })).toBe(false);
  });

  it("allows targeting a different player in the second phase", () => {
    const game = makeWolfCubBonusGame({
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
    });
    expect(action.isValid(game, "w1", { targetPlayerId: "p4" })).toBe(true);
  });
});
