import { describe, it, expect } from "vitest";
import {
  SecretVillainPhase,
  type SecretVillainTurnState,
  PolicyCard,
} from "../types";
import { getNextPresidentId, getEligibleChancellorIds } from "./turn-state";

function makeTurnState(
  overrides: Partial<SecretVillainTurnState> = {},
): SecretVillainTurnState {
  return {
    presidentOrder: ["p1", "p2", "p3", "p4", "p5"],
    currentPresidentIndex: 0,
    turn: 1,
    phase: {
      type: SecretVillainPhase.ElectionNomination,
      startedAt: 1000,
      presidentId: "p1",
    },
    goodCardsPlayed: 0,
    badCardsPlayed: 0,
    deck: [] as PolicyCard[],
    discardPile: [] as PolicyCard[],
    eliminatedPlayerIds: [],
    failedElectionCount: 0,
    ...overrides,
  };
}

describe("getNextPresidentId", () => {
  it("returns the player at currentPresidentIndex", () => {
    const ts = makeTurnState({ currentPresidentIndex: 0 });
    const result = getNextPresidentId(ts);
    expect(result.presidentId).toBe("p1");
    expect(result.nextIndex).toBe(1);
  });

  it("skips eliminated players", () => {
    const ts = makeTurnState({
      currentPresidentIndex: 0,
      eliminatedPlayerIds: ["p1"],
    });
    const result = getNextPresidentId(ts);
    expect(result.presidentId).toBe("p2");
    expect(result.nextIndex).toBe(2);
  });

  it("wraps around the rotation", () => {
    const ts = makeTurnState({ currentPresidentIndex: 4 });
    const result = getNextPresidentId(ts);
    expect(result.presidentId).toBe("p5");
    expect(result.nextIndex).toBe(0);
  });

  it("wraps around and skips eliminated players", () => {
    const ts = makeTurnState({
      currentPresidentIndex: 4,
      eliminatedPlayerIds: ["p5"],
    });
    const result = getNextPresidentId(ts);
    expect(result.presidentId).toBe("p1");
    expect(result.nextIndex).toBe(1);
  });

  it("returns specialPresidentId when set without advancing index", () => {
    const ts = makeTurnState({
      currentPresidentIndex: 2,
      specialPresidentId: "p5",
    });
    const result = getNextPresidentId(ts);
    expect(result.presidentId).toBe("p5");
    expect(result.nextIndex).toBe(2);
  });
});

describe("getEligibleChancellorIds", () => {
  it("excludes the president", () => {
    const ts = makeTurnState();
    const eligible = getEligibleChancellorIds(ts, "p1");
    expect(eligible).not.toContain("p1");
  });

  it("excludes eliminated players", () => {
    const ts = makeTurnState({ eliminatedPlayerIds: ["p3"] });
    const eligible = getEligibleChancellorIds(ts, "p1");
    expect(eligible).not.toContain("p3");
  });

  it("excludes previous chancellor", () => {
    const ts = makeTurnState({ previousChancellorId: "p2" });
    const eligible = getEligibleChancellorIds(ts, "p1");
    expect(eligible).not.toContain("p2");
  });

  it("excludes previous president when >5 alive players", () => {
    const ts = makeTurnState({
      presidentOrder: ["p1", "p2", "p3", "p4", "p5", "p6"],
      previousPresidentId: "p3",
    });
    const eligible = getEligibleChancellorIds(ts, "p1");
    expect(eligible).not.toContain("p3");
  });

  it("does NOT exclude previous president when <=5 alive players", () => {
    const ts = makeTurnState({ previousPresidentId: "p3" });
    const eligible = getEligibleChancellorIds(ts, "p1");
    expect(eligible).toContain("p3");
  });

  it("does NOT exclude previous president when <=5 alive due to eliminations", () => {
    const ts = makeTurnState({
      presidentOrder: ["p1", "p2", "p3", "p4", "p5", "p6"],
      eliminatedPlayerIds: ["p6"],
      previousPresidentId: "p3",
    });
    const eligible = getEligibleChancellorIds(ts, "p1");
    expect(eligible).toContain("p3");
  });

  it("returns all eligible players", () => {
    const ts = makeTurnState();
    const eligible = getEligibleChancellorIds(ts, "p1");
    expect(eligible).toEqual(["p2", "p3", "p4", "p5"]);
  });
});
