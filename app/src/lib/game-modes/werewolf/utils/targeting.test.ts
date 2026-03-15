import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../roles";
import { getTargetablePlayers } from "./targeting";

const players = [
  { id: "owner", name: "Owner" },
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
];

describe("getTargetablePlayers", () => {
  it("excludes the game owner", () => {
    const result = getTargetablePlayers(players, "owner", [], "", null, []);
    expect(result.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("excludes dead players", () => {
    const result = getTargetablePlayers(players, "owner", ["p2"], "", null, []);
    expect(result.map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  it("excludes multiple dead players", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      ["p1", "p3"],
      "",
      null,
      [],
    );
    expect(result.map((p) => p.id)).toEqual(["p2"]);
  });

  it("returns all non-owner players when no one is dead", () => {
    const result = getTargetablePlayers(players, "owner", [], "", null, []);
    expect(result).toHaveLength(3);
  });

  it("handles undefined ownerPlayerId", () => {
    const result = getTargetablePlayers(players, undefined, [], "", null, []);
    expect(result).toHaveLength(4);
  });

  it("returns empty array when all non-owner players are dead", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      ["p1", "p2", "p3"],
      "",
      null,
      [],
    );
    expect(result).toHaveLength(0);
  });

  it("Bodyguard can target themselves", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      WerewolfRole.Bodyguard,
      "p1",
      [],
    );
    expect(result.map((p) => p.id)).toContain("p1");
  });

  it("Witch can target themselves", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      WerewolfRole.Witch,
      "p1",
      [],
    );
    expect(result.map((p) => p.id)).toContain("p1");
  });

  it("Seer cannot target themselves", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      WerewolfRole.Seer,
      "p1",
      [],
    );
    expect(result.map((p) => p.id)).not.toContain("p1");
  });
});
