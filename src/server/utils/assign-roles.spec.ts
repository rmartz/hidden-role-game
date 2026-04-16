import { describe, it, expect } from "vitest";
import { Team } from "@/lib/types";
import type { RoleDefinition } from "@/lib/types";
import {
  assignRolesFromBuckets,
  assignRolesFromBucketsWithHidden,
} from "./assign-roles";
import type { LobbyPlayer, RoleBucket } from "@/lib/types";

function makePlayers(count: number): LobbyPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i}`,
    name: `Player ${i}`,
    sessionId: `session-${i}`,
  }));
}

const mockRoles: Record<string, RoleDefinition<string, Team>> = {
  good: {
    id: "good",
    name: "Good",
    team: Team.Good,
    summary: "",
    description: "",
  },
  bad: {
    id: "bad",
    name: "Bad",
    team: Team.Bad,
    summary: "",
    description: "",
  },
  neutral: {
    id: "neutral",
    name: "Neutral",
    team: Team.Neutral,
    summary: "",
    description: "",
  },
};

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

describe("assignRolesFromBucketsWithHidden", () => {
  it("assigns roles to players and returns hidden role IDs", () => {
    const players = makePlayers(3);
    const buckets: RoleBucket[] = [
      { playerCount: 3, roleId: "good" },
      { playerCount: 1, roleId: "bad" },
    ];

    const { assignments, hiddenRoleIds } = assignRolesFromBucketsWithHidden(
      players,
      buckets,
      1,
      mockRoles,
    );

    expect(assignments).toHaveLength(3);
    expect(hiddenRoleIds).toHaveLength(1);
    const allRoles = [
      ...assignments.map((a) => a.roleDefinitionId),
      ...hiddenRoleIds,
    ].sort();
    expect(allRoles).toEqual(["bad", "good", "good", "good"]);
  });

  it("prefers hiding Good roles over the last Bad/Neutral role", () => {
    const players = makePlayers(3);
    // 1 bad, 3 good, 1 hidden → hiding must pick a good role since bad is the only bad
    const buckets: RoleBucket[] = [
      { playerCount: 1, roleId: "bad" },
      { playerCount: 3, roleId: "good" },
    ];

    for (let i = 0; i < 20; i++) {
      const { hiddenRoleIds } = assignRolesFromBucketsWithHidden(
        players,
        buckets,
        1,
        mockRoles,
      );
      expect(hiddenRoleIds[0]).toBe("good");
    }
  });

  it("can hide a Bad role when multiple Bad/Neutral roles remain", () => {
    const players = makePlayers(3);
    // 2 bad + 2 good, hide 1 → can hide either
    const buckets: RoleBucket[] = [
      { playerCount: 2, roleId: "bad" },
      { playerCount: 2, roleId: "good" },
    ];

    const hiddenRoleIdSet = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const { hiddenRoleIds } = assignRolesFromBucketsWithHidden(
        players,
        buckets,
        1,
        mockRoles,
      );
      hiddenRoleIds.forEach((r) => hiddenRoleIdSet.add(r));
    }
    // After 40 runs, both bad and good should have appeared as hidden at least once
    expect(hiddenRoleIdSet.has("bad")).toBe(true);
    expect(hiddenRoleIdSet.has("good")).toBe(true);
  });

  it("throws when role count does not match players + hidden", () => {
    const players = makePlayers(3);
    const buckets: RoleBucket[] = [
      { playerCount: 3, roleId: "good" }, // only 3 total, need 3+1=4
    ];

    expect(() =>
      assignRolesFromBucketsWithHidden(players, buckets, 1, mockRoles),
    ).toThrow();
  });

  it("throws when a bucket contains an unknown role ID", () => {
    // 1 player + 1 hidden = 2 total: [bad, unknown-role-id].
    // Either the unknown is the candidate (throws immediately) or the bad role
    // is the candidate and the filter encounters the unknown (also throws).
    const players = makePlayers(1);
    const buckets: RoleBucket[] = [
      { playerCount: 1, roleId: "bad" },
      { playerCount: 1, roleId: "unknown-role-id" },
    ];

    expect(() =>
      assignRolesFromBucketsWithHidden(players, buckets, 1, mockRoles),
    ).toThrow(/not defined in the roles registry/);
  });
});
