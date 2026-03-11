import { describe, it, expect } from "vitest";
import { assignRoles } from "./assign-roles";
import type { LobbyPlayer } from "@/lib/types";

function makePlayers(count: number): LobbyPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i}`,
    name: `Player ${i}`,
    sessionId: `session-${i}`,
  }));
}

describe("assignRoles", () => {
  it("assigns exactly one role per player", () => {
    const players = makePlayers(3);
    const roleSlots = [
      { roleId: "good", min: 2, max: 2 },
      { roleId: "bad", min: 1, max: 1 },
    ];

    const assignments = assignRoles(players, roleSlots);

    expect(assignments).toHaveLength(3);
    expect(assignments.map((a) => a.playerId)).toEqual(
      players.map((p) => p.id),
    );
  });

  it("uses all roles from the expanded slots exactly once", () => {
    const players = makePlayers(4);
    const roleSlots = [
      { roleId: "good", min: 3, max: 3 },
      { roleId: "bad", min: 1, max: 1 },
    ];

    const assignments = assignRoles(players, roleSlots);
    const assignedRoles = assignments.map((a) => a.roleDefinitionId).sort();

    expect(assignedRoles).toEqual(["bad", "good", "good", "good"]);
  });

  it("shuffles roles across repeated calls", () => {
    const players = makePlayers(6);
    const roleSlots = [
      { roleId: "good", min: 3, max: 3 },
      { roleId: "bad", min: 3, max: 3 },
    ];

    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const assignments = assignRoles(players, roleSlots);
      results.add(assignments.map((a) => a.roleDefinitionId).join(","));
    }

    // With 6 players and 2 role types there are C(6,3)=20 possible arrangements;
    // after 20 runs the probability of seeing only one ordering is (1/20)^19 ≈ 0.
    expect(results.size).toBeGreaterThan(1);
  });

  it("works with a single role type", () => {
    const players = makePlayers(2);
    const roleSlots = [{ roleId: "good", min: 2, max: 2 }];

    const assignments = assignRoles(players, roleSlots);

    expect(assignments).toHaveLength(2);
    expect(assignments.every((a) => a.roleDefinitionId === "good")).toBe(true);
  });
});
