import { describe, expect, it } from "vitest";

import { WerewolfRole } from "../../roles";
import { getGroupPhaseMemberIds, getTargetablePlayers } from "../targeting";

const players = [
  { id: "owner", name: "Owner" },
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
];

// ---------------------------------------------------------------------------
// Team phase targeting
// ---------------------------------------------------------------------------

const narratorAssignments = [
  { player: { id: "p1" }, role: { id: WerewolfRole.Werewolf, team: "Bad" } },
  { player: { id: "p2" }, role: { id: WerewolfRole.Werewolf, team: "Bad" } },
  { player: { id: "p3" }, role: { id: WerewolfRole.Villager, team: "Good" } },
];

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

// ---------------------------------------------------------------------------
// getGroupPhaseMemberIds — hidden allies are targetable
// ---------------------------------------------------------------------------

describe("getGroupPhaseMemberIds", () => {
  it("includes Werewolves and Wolf Cubs (wake-phase participants)", () => {
    const assignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "wc1", roleDefinitionId: WerewolfRole.WolfCub },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
    ];
    const result = getGroupPhaseMemberIds(assignments, WerewolfRole.Werewolf);
    expect(result).toContain("w1");
    expect(result).toContain("wc1");
    expect(result).not.toContain("p1");
  });

  it("does NOT include Wizard (Team.Bad but no wakesWith)", () => {
    const assignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "wiz1", roleDefinitionId: WerewolfRole.Wizard },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
    ];
    const result = getGroupPhaseMemberIds(assignments, WerewolfRole.Werewolf);
    expect(result).toContain("w1");
    expect(result).not.toContain("wiz1");
  });

  it("does NOT include Minion (Team.Bad but no wakesWith Werewolf)", () => {
    const assignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "min1", roleDefinitionId: WerewolfRole.Minion },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
    ];
    const result = getGroupPhaseMemberIds(assignments, WerewolfRole.Werewolf);
    expect(result).toContain("w1");
    expect(result).not.toContain("min1");
  });
});
