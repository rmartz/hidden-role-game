import { describe, it, expect } from "vitest";
import { Team } from "@/lib/types";
import { WerewolfRole } from "../roles";
import { getTeamPhaseKey } from "./phase-keys";
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

// ---------------------------------------------------------------------------
// Team phase targeting
// ---------------------------------------------------------------------------

const teamPhaseKey = getTeamPhaseKey(Team.Bad);

// Narrator sees all assignments (no self-skip).
const narratorAssignments = [
  { player: { id: "p1" }, role: { id: WerewolfRole.Werewolf, team: Team.Bad } },
  { player: { id: "p2" }, role: { id: WerewolfRole.Werewolf, team: Team.Bad } },
  {
    player: { id: "p3" },
    role: { id: WerewolfRole.Villager, team: Team.Good },
  },
];

// Player p1 sees only other team members — their own assignment is absent
// (mirrors buildGamePlayers which skips `other.playerId === assignment.playerId`).
const p1Assignments = [
  { player: { id: "p2" }, role: { id: WerewolfRole.Werewolf, team: Team.Bad } },
];

describe("getTargetablePlayers — team phase", () => {
  it("werewolf player cannot target themselves", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      teamPhaseKey,
      "p1",
      p1Assignments,
    );
    expect(result.map((p) => p.id)).not.toContain("p1");
  });

  it("werewolf player cannot target visible teammates", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      teamPhaseKey,
      "p1",
      p1Assignments,
    );
    expect(result.map((p) => p.id)).not.toContain("p2");
  });

  it("werewolf player can target non-team players", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      teamPhaseKey,
      "p1",
      p1Assignments,
    );
    expect(result.map((p) => p.id)).toContain("p3");
  });

  it("narrator and player produce the same targetable set for team phases", () => {
    const narratorResult = getTargetablePlayers(
      players,
      "owner",
      [],
      teamPhaseKey,
      null,
      narratorAssignments,
    );
    const playerResult = getTargetablePlayers(
      players,
      "owner",
      [],
      teamPhaseKey,
      "p1",
      p1Assignments,
    );
    expect(narratorResult.map((p) => p.id).sort()).toEqual(
      playerResult.map((p) => p.id).sort(),
    );
  });
});
