import { describe, it, expect } from "vitest";
import { assignRolesFromBuckets } from "./assign-roles";
import type { LobbyPlayer, RoleBucket } from "@/lib/types";

function makePlayers(count: number): LobbyPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i}`,
    name: `Player ${i}`,
    sessionId: `session-${i}`,
  }));
}

describe("assignRolesFromBuckets", () => {
  it("assigns exactly one role per player", () => {
    const players = makePlayers(3);
    const buckets: RoleBucket[] = [
      { playerCount: 2, roles: [{ roleId: "good" }] },
      { playerCount: 1, roles: [{ roleId: "bad" }] },
    ];

    const assignments = assignRolesFromBuckets(players, buckets);

    expect(assignments).toHaveLength(3);
    expect(assignments.map((a) => a.playerId)).toEqual(
      players.map((p) => p.id),
    );
  });

  it("uses all roles from the buckets exactly as specified", () => {
    const players = makePlayers(4);
    const buckets: RoleBucket[] = [
      { playerCount: 3, roles: [{ roleId: "good" }] },
      { playerCount: 1, roles: [{ roleId: "bad" }] },
    ];

    const assignments = assignRolesFromBuckets(players, buckets);
    const assignedRoles = assignments.map((a) => a.roleDefinitionId).sort();

    expect(assignedRoles).toEqual(["bad", "good", "good", "good"]);
  });

  it("shuffles roles across repeated calls", () => {
    const players = makePlayers(6);
    const buckets: RoleBucket[] = [
      { playerCount: 3, roles: [{ roleId: "good" }] },
      { playerCount: 3, roles: [{ roleId: "bad" }] },
    ];

    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const assignments = assignRolesFromBuckets(players, buckets);
      results.add(assignments.map((a) => a.roleDefinitionId).join(","));
    }

    // With 6 players and 2 role types there are C(6,3)=20 possible arrangements;
    // after 20 runs the probability of seeing only one ordering is (1/20)^19 ≈ 0.
    expect(results.size).toBeGreaterThan(1);
  });

  it("works with a single role type bucket", () => {
    const players = makePlayers(2);
    const buckets: RoleBucket[] = [
      { playerCount: 2, roles: [{ roleId: "good" }] },
    ];

    const assignments = assignRolesFromBuckets(players, buckets);

    expect(assignments).toHaveLength(2);
    expect(assignments.every((a) => a.roleDefinitionId === "good")).toBe(true);
  });

  it("assigns simple buckets as fixed copies of their single role", () => {
    const players = makePlayers(4);
    const buckets: RoleBucket[] = [
      { playerCount: 1, roleId: "villain" },
      { playerCount: 3, roleId: "hero" },
    ];

    const assignments = assignRolesFromBuckets(players, buckets);
    const roles = assignments.map((a) => a.roleDefinitionId).sort();

    expect(roles).toEqual(["hero", "hero", "hero", "villain"]);
  });

  it("respects max=1 (unique) constraint — role appears at most once", () => {
    const players = makePlayers(4);
    const buckets: RoleBucket[] = [
      {
        playerCount: 4,
        roles: [{ roleId: "seer", max: 1 }, { roleId: "villager" }],
      },
    ];

    for (let i = 0; i < 20; i++) {
      const assignments = assignRolesFromBuckets(players, buckets);
      const seerCount = assignments.filter(
        (a) => a.roleDefinitionId === "seer",
      ).length;
      expect(seerCount).toBeLessThanOrEqual(1);
    }
  });

  it("throws when max capacity is too low to fill bucket", () => {
    const players = makePlayers(3);
    const buckets: RoleBucket[] = [
      {
        playerCount: 3,
        roles: [
          { roleId: "cop", max: 1 },
          { roleId: "seer", max: 1 },
          // total max = 2 < playerCount = 3
        ],
      },
    ];

    expect(() => assignRolesFromBuckets(players, buckets)).toThrow();
  });
});
