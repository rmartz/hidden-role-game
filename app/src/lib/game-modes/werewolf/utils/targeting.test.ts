import { describe, it, expect } from "vitest";
import { Team } from "@/lib/types";
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
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      "",
      undefined,
      [],
    );
    expect(result.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("excludes dead players", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      ["p2"],
      "",
      undefined,
      [],
    );
    expect(result.map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  it("excludes multiple dead players", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      ["p1", "p3"],
      "",
      undefined,
      [],
    );
    expect(result.map((p) => p.id)).toEqual(["p2"]);
  });

  it("returns all non-owner players when no one is dead", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      "",
      undefined,
      [],
    );
    expect(result).toHaveLength(3);
  });

  it("handles undefined ownerPlayerId", () => {
    const result = getTargetablePlayers(
      players,
      undefined,
      [],
      "",
      undefined,
      [],
    );
    expect(result).toHaveLength(4);
  });

  it("returns empty array when all non-owner players are dead", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      ["p1", "p2", "p3"],
      "",
      undefined,
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

  it("Narrator view excludes Seer from Seer phase targets", () => {
    const assignments = [
      {
        player: { id: "p1" },
        role: { id: WerewolfRole.Seer, team: Team.Good },
      },
    ];
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      WerewolfRole.Seer,
      undefined,
      assignments,
    );
    expect(result.map((p) => p.id)).not.toContain("p1");
  });
});

// ---------------------------------------------------------------------------
// Solo phase targeting — narrator vs player parity
// ---------------------------------------------------------------------------

// Narrator sees all assignments including the acting player's own role.
const seerNarratorAssignments = [
  { player: { id: "p1" }, role: { id: WerewolfRole.Seer, team: Team.Good } },
  {
    player: { id: "p2" },
    role: { id: WerewolfRole.Villager, team: Team.Good },
  },
  {
    player: { id: "p3" },
    role: { id: WerewolfRole.Villager, team: Team.Good },
  },
];

// Player p1 does not see their own assignment (mirrors buildGamePlayers).
const seerPlayerAssignments: typeof seerNarratorAssignments = [];

describe("getTargetablePlayers — solo phase", () => {
  it("narrator and player produce the same targetable set for Investigate phase", () => {
    const narratorResult = getTargetablePlayers(
      players,
      "owner",
      [],
      WerewolfRole.Seer,
      undefined,
      seerNarratorAssignments,
    );
    const playerResult = getTargetablePlayers(
      players,
      "owner",
      [],
      WerewolfRole.Seer,
      "p1",
      seerPlayerAssignments,
    );
    expect(narratorResult.map((p) => p.id).sort()).toEqual(
      playerResult.map((p) => p.id).sort(),
    );
  });

  it("narrator does not exclude Bodyguard from Protect phase targets", () => {
    const assignments = [
      {
        player: { id: "p1" },
        role: { id: WerewolfRole.Bodyguard, team: Team.Good },
      },
    ];
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      WerewolfRole.Bodyguard,
      undefined,
      assignments,
    );
    expect(result.map((p) => p.id)).toContain("p1");
  });
});

// ---------------------------------------------------------------------------
// Team phase targeting
// ---------------------------------------------------------------------------

// Narrator sees all assignments (no self-skip).
const narratorAssignments = [
  { player: { id: "p1" }, role: { id: WerewolfRole.Werewolf, team: "Bad" } },
  { player: { id: "p2" }, role: { id: WerewolfRole.Werewolf, team: "Bad" } },
  { player: { id: "p3" }, role: { id: WerewolfRole.Villager, team: "Good" } },
];

// Player p1 sees only other team members — their own assignment is absent
// (mirrors buildGamePlayers which skips `other.playerId === assignment.playerId`).
const p1Assignments = [
  { player: { id: "p2" }, role: { id: WerewolfRole.Werewolf, team: "Bad" } },
];

describe("getTargetablePlayers — group phase (Werewolf)", () => {
  it("werewolf player cannot target themselves", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      WerewolfRole.Werewolf,
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
      WerewolfRole.Werewolf,
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
      WerewolfRole.Werewolf,
      "p1",
      p1Assignments,
    );
    expect(result.map((p) => p.id)).toContain("p3");
  });

  it("narrator and player produce the same targetable set for group phases", () => {
    const narratorResult = getTargetablePlayers(
      players,
      "owner",
      [],
      WerewolfRole.Werewolf,
      undefined,
      narratorAssignments,
    );
    const playerResult = getTargetablePlayers(
      players,
      "owner",
      [],
      WerewolfRole.Werewolf,
      "p1",
      p1Assignments,
    );
    expect(narratorResult.map((p) => p.id).sort()).toEqual(
      playerResult.map((p) => p.id).sort(),
    );
  });
});

// ---------------------------------------------------------------------------
// Group phase targeting — suffixed phase key (Wolf Cub bonus attack)
// ---------------------------------------------------------------------------

const SUFFIXED_WEREWOLF_PHASE_KEY = "werewolf-werewolf:2";

describe("getTargetablePlayers — group phase (suffixed key)", () => {
  it("Werewolf teammate is excluded even when phase key is suffixed", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      SUFFIXED_WEREWOLF_PHASE_KEY,
      "p1",
      p1Assignments,
    );
    expect(result.map((p) => p.id)).not.toContain("p2");
  });

  it("Wolf Cub (wakesWith Werewolf) is excluded even when phase key is suffixed", () => {
    const wolfCubAssignments = [
      {
        player: { id: "p2" },
        role: { id: WerewolfRole.WolfCub, team: "Bad" },
      },
    ];
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      SUFFIXED_WEREWOLF_PHASE_KEY,
      "p1",
      wolfCubAssignments,
    );
    expect(result.map((p) => p.id)).not.toContain("p2");
  });

  it("non-team players are still included when phase key is suffixed", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      [],
      SUFFIXED_WEREWOLF_PHASE_KEY,
      "p1",
      p1Assignments,
    );
    expect(result.map((p) => p.id)).toContain("p3");
  });
});
