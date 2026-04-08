import { describe, it, expect } from "vitest";
import { GameMode } from "@/lib/types";
import { SecretVillainRole } from "./roles";
import { SECRET_VILLAIN_CONFIG } from "./config";

const noBoard = { gameMode: GameMode.SecretVillain } as const;
const withBoard = {
  gameMode: GameMode.SecretVillain,
  includeBoard: true,
} as const;

describe("SECRET_VILLAIN_CONFIG.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (5)", () => {
    const slots = SECRET_VILLAIN_CONFIG.defaultRoleCount(5);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));

    expect(counts[SecretVillainRole.SpecialBad]).toBe(1);
    expect(counts[SecretVillainRole.Bad]).toBe(1);
    expect(counts[SecretVillainRole.Good]).toBe(3);
  });

  it("returns correct counts for 10 players", () => {
    const slots = SECRET_VILLAIN_CONFIG.defaultRoleCount(10);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));

    expect(counts[SecretVillainRole.SpecialBad]).toBe(1);
    expect(counts[SecretVillainRole.Bad]).toBe(3);
    expect(counts[SecretVillainRole.Good]).toBe(6);
  });

  it("total slot count always equals numPlayers", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = SECRET_VILLAIN_CONFIG.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.min, 0)).toBe(n);
    }
  });

  it("always has exactly 1 special-bad role", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = SECRET_VILLAIN_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
      expect(counts[SecretVillainRole.SpecialBad]).toBe(1);
    }
  });

  it("bad count is approximately half of players minus the special bad", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = SECRET_VILLAIN_CONFIG.defaultRoleCount(n);
      const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
      expect(counts[SecretVillainRole.Bad]).toBe(Math.floor((n - 1) / 2) - 1);
    }
  });
});

describe("SECRET_VILLAIN_CONFIG.resolveOwnerTitle", () => {
  it("returns null when includeBoard is absent", () => {
    expect(SECRET_VILLAIN_CONFIG.resolveOwnerTitle(noBoard)).toBeNull();
  });

  it("returns 'Board' when includeBoard is true", () => {
    expect(SECRET_VILLAIN_CONFIG.resolveOwnerTitle(withBoard)).toBe("Board");
  });
});

describe("SECRET_VILLAIN_CONFIG.resolveOwnerSeesRoleAssignments", () => {
  it("returns true when includeBoard is absent", () => {
    expect(SECRET_VILLAIN_CONFIG.resolveOwnerSeesRoleAssignments(noBoard)).toBe(
      true,
    );
  });

  it("returns false when includeBoard is true", () => {
    expect(
      SECRET_VILLAIN_CONFIG.resolveOwnerSeesRoleAssignments(withBoard),
    ).toBe(false);
  });
});

describe("SECRET_VILLAIN_CONFIG.resolveRoleSlotsRequired", () => {
  it("returns numPlayers when includeBoard is absent", () => {
    expect(SECRET_VILLAIN_CONFIG.resolveRoleSlotsRequired(8, noBoard)).toBe(8);
  });

  it("returns numPlayers - 1 when includeBoard is true", () => {
    expect(SECRET_VILLAIN_CONFIG.resolveRoleSlotsRequired(8, withBoard)).toBe(
      7,
    );
  });
});

describe("SECRET_VILLAIN_CONFIG.resolveIsValidRoleCount", () => {
  const roleCounts = {
    [SecretVillainRole.SpecialBad]: 1,
    [SecretVillainRole.Bad]: 2,
    [SecretVillainRole.Good]: 4,
  };

  it("validates role count for 7-player game without board (7 role slots)", () => {
    expect(
      SECRET_VILLAIN_CONFIG.resolveIsValidRoleCount(7, roleCounts, noBoard),
    ).toBe(true);
  });

  it("validates role count for 8-player game with board (7 role slots)", () => {
    expect(
      SECRET_VILLAIN_CONFIG.resolveIsValidRoleCount(8, roleCounts, withBoard),
    ).toBe(true);
  });

  it("rejects role count when total does not match expected slots", () => {
    expect(
      SECRET_VILLAIN_CONFIG.resolveIsValidRoleCount(8, roleCounts, noBoard),
    ).toBe(false);
  });
});
