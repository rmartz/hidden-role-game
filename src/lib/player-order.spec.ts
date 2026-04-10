import { describe, it, expect } from "vitest";
import { resolvePlayerOrder } from "./player-order";

describe("resolvePlayerOrder", () => {
  it("returns storedOrder when all IDs are current", () => {
    expect(resolvePlayerOrder(["p3", "p1", "p2"], ["p1", "p2", "p3"])).toEqual([
      "p3",
      "p1",
      "p2",
    ]);
  });

  it("appends new players at the end in their original order", () => {
    expect(resolvePlayerOrder(["p1", "p2"], ["p1", "p2", "p3", "p4"])).toEqual([
      "p1",
      "p2",
      "p3",
      "p4",
    ]);
  });

  it("drops stale IDs that are no longer in currentPlayerIds", () => {
    expect(resolvePlayerOrder(["p1", "p99", "p2"], ["p1", "p2"])).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("handles all stored IDs being stale", () => {
    expect(resolvePlayerOrder(["p99", "p98"], ["p1", "p2"])).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("returns currentPlayerIds in original order when storedOrder is undefined", () => {
    expect(resolvePlayerOrder(undefined, ["p1", "p2", "p3"])).toEqual([
      "p1",
      "p2",
      "p3",
    ]);
  });

  it("returns currentPlayerIds in original order when storedOrder is empty", () => {
    expect(resolvePlayerOrder([], ["p1", "p2", "p3"])).toEqual([
      "p1",
      "p2",
      "p3",
    ]);
  });

  it("returns an empty array when both inputs are empty", () => {
    expect(resolvePlayerOrder([], [])).toEqual([]);
  });

  it("returns an empty array when currentPlayerIds is empty", () => {
    expect(resolvePlayerOrder(["p1", "p2"], [])).toEqual([]);
  });
});
