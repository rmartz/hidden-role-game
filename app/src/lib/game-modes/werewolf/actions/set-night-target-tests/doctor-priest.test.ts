import { describe, it, expect } from "vitest";
import type { Game } from "@/lib/types";
import type { WerewolfTurnState } from "../../types";
import { WerewolfRole } from "../../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../index";
import { makePlayingGame, makeNightState } from "../test-helpers";

// ---------------------------------------------------------------------------
// Doctor self-targeting
// ---------------------------------------------------------------------------

describe("SetNightTarget — Doctor self-targeting", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  function makeDoctorGame(nightState: WerewolfTurnState): Game {
    return makePlayingGame(nightState, {
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Doctor },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
  }

  const doctorNightState = makeNightState({
    turn: 2,
    nightPhaseOrder: [WerewolfRole.Doctor],
  });

  it("Doctor cannot target themselves", () => {
    const game = makeDoctorGame(doctorNightState);
    expect(action.isValid(game, "p1", { targetPlayerId: "p1" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Priest ward blocking
// ---------------------------------------------------------------------------

describe("SetNightTarget — Priest ward blocking", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  function makePriestGame(
    nightState: WerewolfTurnState,
    overrides: Partial<Game> = {},
  ): Game {
    return makePlayingGame(nightState, {
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Priest },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
      ...overrides,
    });
  }

  it("Priest cannot target when they have an active ward on a living player", () => {
    const nightState = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Priest],
    });
    nightState.priestWards = { p2: "p1" };
    const game = makePriestGame(nightState);
    expect(action.isValid(game, "p1", { targetPlayerId: "p3" })).toBe(false);
  });

  it("Priest CAN target when their ward's target is dead", () => {
    const nightState = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Priest],
      deadPlayerIds: ["p2"],
    });
    nightState.priestWards = { p2: "p1" };
    const game = makePriestGame(nightState);
    expect(action.isValid(game, "p1", { targetPlayerId: "p3" })).toBe(true);
  });
});
