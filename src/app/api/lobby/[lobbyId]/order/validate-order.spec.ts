import { describe, it, expect } from "vitest";
import { validatePlayerOrder } from "./validate-order";

const players = [{ id: "p1" }, { id: "p2" }, { id: "p3" }];

describe("validatePlayerOrder", () => {
  it("accepts a valid reordering containing all player IDs", () => {
    const result = validatePlayerOrder(
      { playerOrder: ["p3", "p1", "p2"] },
      players,
    );
    expect(result).toEqual({ valid: true, playerOrder: ["p3", "p1", "p2"] });
  });

  it("accepts the same order as the lobby", () => {
    const result = validatePlayerOrder(
      { playerOrder: ["p1", "p2", "p3"] },
      players,
    );
    expect(result).toEqual({ valid: true, playerOrder: ["p1", "p2", "p3"] });
  });

  it("rejects when playerOrder is missing from body", () => {
    const result = validatePlayerOrder({}, players);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(400);
      expect(result.error).toMatch(/array of strings/);
    }
  });

  it("rejects when playerOrder is not an array", () => {
    const result = validatePlayerOrder({ playerOrder: "p1,p2,p3" }, players);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.status).toBe(400);
  });

  it("rejects when playerOrder contains non-string elements", () => {
    const result = validatePlayerOrder(
      { playerOrder: ["p1", 2, "p3"] },
      players,
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.status).toBe(400);
  });

  it("rejects when playerOrder is missing a lobby player ID", () => {
    const result = validatePlayerOrder({ playerOrder: ["p1", "p2"] }, players);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(400);
      expect(result.error).toMatch(/exactly all current player IDs/);
    }
  });

  it("rejects when playerOrder contains an extra unknown ID", () => {
    const result = validatePlayerOrder(
      { playerOrder: ["p1", "p2", "p3", "p4"] },
      players,
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.status).toBe(400);
  });

  it("rejects when playerOrder has correct length but wrong IDs", () => {
    const result = validatePlayerOrder(
      { playerOrder: ["p1", "p2", "unknown"] },
      players,
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.status).toBe(400);
  });

  it("rejects a null body", () => {
    const result = validatePlayerOrder(null, players);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.status).toBe(400);
  });

  it("accepts an empty order for an empty lobby", () => {
    const result = validatePlayerOrder({ playerOrder: [] }, []);
    expect(result).toEqual({ valid: true, playerOrder: [] });
  });
});
