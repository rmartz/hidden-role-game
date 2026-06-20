import { describe, expect, it } from "vitest";

import { secretVillainServices } from "../services";
import type { SecretVillainTurnState } from "../types";
import {
  DECK_BAD_CARDS,
  DECK_GOOD_CARDS,
  PolicyCard,
  SecretVillainPhase,
  SpecialActionType,
  SvBoardPreset,
} from "../types";
import { assignments, playerIds } from "./helpers";

describe("buildInitialTurnState", () => {
  it("initializes expected defaults", () => {
    const ts = secretVillainServices.buildInitialTurnState(
      assignments,
    ) as SecretVillainTurnState;
    expect(ts.turn).toBe(1);
    expect(ts.currentPresidentIndex).toBe(1);
    expect(ts.goodCardsPlayed).toBe(0);
    expect(ts.badCardsPlayed).toBe(0);
    expect(ts.discardPile).toEqual([]);
    expect(ts.eliminatedPlayerIds).toEqual([]);
    expect(ts.failedElectionCount).toBe(0);
  });

  it("starts in ElectionNomination phase with the first president", () => {
    const ts = secretVillainServices.buildInitialTurnState(
      assignments,
    ) as SecretVillainTurnState;
    expect(ts.phase.type).toBe(SecretVillainPhase.ElectionNomination);
    expect(ts.phase.presidentId).toBe(ts.presidentOrder[0]);
  });

  it("creates a deck with 17 cards (6 Good + 11 Bad)", () => {
    const ts = secretVillainServices.buildInitialTurnState(
      assignments,
    ) as SecretVillainTurnState;
    expect(ts.deck).toHaveLength(DECK_GOOD_CARDS + DECK_BAD_CARDS);
    const goodCount = ts.deck.filter((c) => c === PolicyCard.Good).length;
    const badCount = ts.deck.filter((c) => c === PolicyCard.Bad).length;
    expect(goodCount).toBe(DECK_GOOD_CARDS);
    expect(badCount).toBe(DECK_BAD_CARDS);
  });

  it("includes all player IDs in presidentOrder", () => {
    const ts = secretVillainServices.buildInitialTurnState(
      assignments,
    ) as SecretVillainTurnState;
    expect(ts.presidentOrder).toHaveLength(playerIds.length);
    for (const id of playerIds) {
      expect(ts.presidentOrder).toContain(id);
    }
  });

  it("wires boardPreset option through to powerTable lookup", () => {
    const ts = secretVillainServices.buildInitialTurnState(assignments, {
      boardPreset: SvBoardPreset.Small,
    }) as SecretVillainTurnState;
    expect(ts.boardPreset).toBe(SvBoardPreset.Small);
    // Small preset has PolicyPeek in slot 2; Medium (the default) has InvestigateTeam there
    expect(ts.powerTable[2]).toBe(SpecialActionType.PolicyPeek);
  });

  it("resolves custom power table when preset is Custom", () => {
    const customPowerTable = [
      SpecialActionType.PolicyPeek,
      SpecialActionType.InvestigateTeam,
      undefined,
    ];
    const ts = secretVillainServices.buildInitialTurnState(assignments, {
      boardPreset: SvBoardPreset.Custom,
      customPowerTable,
    }) as SecretVillainTurnState;
    expect(ts.boardPreset).toBe(SvBoardPreset.Custom);
    expect(ts.powerTable).toEqual([
      SpecialActionType.PolicyPeek,
      SpecialActionType.InvestigateTeam,
      undefined,
      SpecialActionType.Shoot,
      SpecialActionType.Shoot,
    ]);
  });

  it("uses playerOrder from options as president rotation when provided", () => {
    const specifiedOrder = ["p5", "p3", "p1", "p4", "p2"];
    const ts = secretVillainServices.buildInitialTurnState(assignments, {
      playerOrder: specifiedOrder,
    }) as SecretVillainTurnState;
    expect(ts.presidentOrder).toEqual(specifiedOrder);
    expect(ts.phase.presidentId).toBe("p5");
  });

  it("shuffles players when no playerOrder option is provided", () => {
    // Run multiple times to confirm order is not deterministically the input order.
    const results = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const ts = secretVillainServices.buildInitialTurnState(
        assignments,
      ) as SecretVillainTurnState;
      results.add(ts.presidentOrder.join(","));
    }
    // With 5 players there are 120 permutations — extremely unlikely to always match input.
    expect(results.size).toBeGreaterThan(1);
  });
});
