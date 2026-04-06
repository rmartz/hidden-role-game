import { describe, it, expect } from "vitest";
import {
  SecretVillainWinner,
  checkBoardWinCondition,
  checkShootWinCondition,
  checkChancellorElectionWinCondition,
} from "./win-condition";
import type { SecretVillainTurnState } from "../types";
import { SecretVillainPhase, PolicyCard, SvBoardPreset } from "../types";
import { BOARD_PRESETS } from "./special-actions";
import { SecretVillainRole } from "../roles";
import type { PlayerRoleAssignment } from "@/lib/types";

const baseTurnState: SecretVillainTurnState = {
  turn: 1,
  phase: {
    type: SecretVillainPhase.ElectionNomination,
    startedAt: Date.now(),
    presidentId: "p1",
  },
  presidentOrder: ["p1", "p2", "p3"],
  currentPresidentIndex: 0,
  goodCardsPlayed: 0,
  badCardsPlayed: 0,
  deck: [PolicyCard.Good],
  discardPile: [],
  eliminatedPlayerIds: [],
  failedElectionCount: 0,
  boardPreset: SvBoardPreset.Medium,
  powerTable: BOARD_PRESETS[SvBoardPreset.Medium],
};

const roleAssignments: PlayerRoleAssignment[] = [
  { playerId: "p1", roleDefinitionId: SecretVillainRole.Good },
  { playerId: "p2", roleDefinitionId: SecretVillainRole.Bad },
  { playerId: "p3", roleDefinitionId: SecretVillainRole.SpecialBad },
];

describe("checkBoardWinCondition", () => {
  it("returns Good when 5 Good cards played", () => {
    const ts = { ...baseTurnState, goodCardsPlayed: 5 };
    expect(checkBoardWinCondition(ts)).toEqual({
      winner: SecretVillainWinner.Good,
    });
  });

  it("returns Bad when 5 Bad cards played", () => {
    const ts = { ...baseTurnState, badCardsPlayed: 5 };
    expect(checkBoardWinCondition(ts)).toEqual({
      winner: SecretVillainWinner.Bad,
    });
  });

  it("returns undefined when neither team has 5 cards", () => {
    const ts = { ...baseTurnState, goodCardsPlayed: 3, badCardsPlayed: 4 };
    expect(checkBoardWinCondition(ts)).toBeUndefined();
  });

  it("Good wins takes priority if both somehow reach 5", () => {
    const ts = { ...baseTurnState, goodCardsPlayed: 5, badCardsPlayed: 5 };
    expect(checkBoardWinCondition(ts)).toEqual({
      winner: SecretVillainWinner.Good,
    });
  });
});

describe("checkShootWinCondition", () => {
  it("returns Good when Special Bad is eliminated", () => {
    expect(checkShootWinCondition("p3", roleAssignments)).toEqual({
      winner: SecretVillainWinner.Good,
    });
  });

  it("returns undefined when a non-Special Bad player is eliminated", () => {
    expect(checkShootWinCondition("p1", roleAssignments)).toBeUndefined();
    expect(checkShootWinCondition("p2", roleAssignments)).toBeUndefined();
  });
});

describe("checkChancellorElectionWinCondition", () => {
  it("returns Bad when Special Bad is elected chancellor after 3+ bad cards", () => {
    expect(
      checkChancellorElectionWinCondition("p3", roleAssignments, 3),
    ).toEqual({ winner: SecretVillainWinner.Bad });
  });

  it("returns undefined when Special Bad is elected but fewer than 3 bad cards", () => {
    expect(
      checkChancellorElectionWinCondition("p3", roleAssignments, 2),
    ).toBeUndefined();
  });

  it("returns undefined when non-Special Bad is elected after 3+ bad cards", () => {
    expect(
      checkChancellorElectionWinCondition("p1", roleAssignments, 4),
    ).toBeUndefined();
  });
});
