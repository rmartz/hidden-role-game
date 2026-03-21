import { describe, it, expect } from "vitest";
import { GameSerializationService } from "./GameSerializationService";
import { makeDaytimeGameWithNominations } from "./GameSerializationService.test-helpers";

describe("GameSerializationService.extractDaytimeNightState — nominations", () => {
  const service = new GameSerializationService();

  it("nominations are absent when nominationsEnabled is false", () => {
    const game = makeDaytimeGameWithNominations(
      [{ nominatorId: "p2", defendantId: "p3" }],
      false,
    );
    const result = service.extractDaytimeNightState(game, "p2");
    expect(result.nominations).toBeUndefined();
  });

  it("returns empty nominations array when no nominations exist", () => {
    const game = makeDaytimeGameWithNominations([], true);
    const result = service.extractDaytimeNightState(game, "p2");
    expect(result.nominations).toEqual([]);
  });

  it("aggregates nominator IDs by defendant", () => {
    const game = makeDaytimeGameWithNominations(
      [
        { nominatorId: "p2", defendantId: "p3" },
        { nominatorId: "p1", defendantId: "p3" },
      ],
      true,
    );
    const result = service.extractDaytimeNightState(game, "p2");
    expect(result.nominations).toContainEqual({
      defendantId: "p3",
      nominatorIds: ["p2", "p1"],
    });
  });

  it("sets myNominatedDefendantId when caller has a nomination", () => {
    const game = makeDaytimeGameWithNominations(
      [{ nominatorId: "p2", defendantId: "p3" }],
      true,
    );
    const result = service.extractDaytimeNightState(game, "p2");
    expect(result.myNominatedDefendantId).toBe("p3");
  });

  it("myNominatedDefendantId is absent when caller has no nomination", () => {
    const game = makeDaytimeGameWithNominations(
      [{ nominatorId: "p1", defendantId: "p3" }],
      true,
    );
    const result = service.extractDaytimeNightState(game, "p2");
    expect(result.myNominatedDefendantId).toBeUndefined();
  });

  it("separates counts per defendant across multiple defendants", () => {
    const game = makeDaytimeGameWithNominations(
      [
        { nominatorId: "p1", defendantId: "p3" },
        { nominatorId: "p2", defendantId: "p1" },
      ],
      true,
    );
    const result = service.extractDaytimeNightState(game, "p1");
    expect(result.nominations).toHaveLength(2);
    expect(result.nominations).toContainEqual({
      defendantId: "p3",
      nominatorIds: ["p1"],
    });
    expect(result.nominations).toContainEqual({
      defendantId: "p1",
      nominatorIds: ["p2"],
    });
  });
});
