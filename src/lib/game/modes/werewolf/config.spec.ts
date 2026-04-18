import { describe, it, expect } from "vitest";
import type { RoleBucket } from "@/lib/types";
import { isSimpleRoleBucket } from "@/lib/types";
import { GameMode } from "@/lib/types";
import { WerewolfRole, MIN_PLAYERS, MIN_ROLE_PLAYERS } from "./roles";
import { WEREWOLF_CONFIG } from "./config";
import type { WerewolfModeConfig } from "./lobby-config";

const defaultModeConfig: WerewolfModeConfig = {
  gameMode: GameMode.Werewolf,
  nominationsEnabled: true,
  trialsPerDay: 2,
  revealProtections: true,
  showRolesOnDeath: true,
  hiddenRoleCount: 0,
  autoRevealNightOutcome: true,
};

const hiddenModeConfig: WerewolfModeConfig = {
  ...defaultModeConfig,
  hiddenRoleCount: 1,
};

/** Helper: convert simple role buckets to { roleId: playerCount } map */
function bucketCounts(buckets: RoleBucket[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of buckets) {
    if (isSimpleRoleBucket(b)) {
      counts[b.roleId] = (counts[b.roleId] ?? 0) + b.playerCount;
    }
  }
  return counts;
}

describe("WEREWOLF_CONFIG.defaultRoleCount", () => {
  it("returns correct counts for minimum role-player count (6)", () => {
    const buckets = WEREWOLF_CONFIG.defaultRoleCount(MIN_ROLE_PLAYERS);
    const counts = bucketCounts(buckets);

    // 6 role-receiving players: 1 werewolf, 4 villagers, 1 seer
    expect(counts[WerewolfRole.Werewolf]).toBe(1);
    expect(counts[WerewolfRole.Villager]).toBe(4);
    expect(counts[WerewolfRole.Seer]).toBe(1);
  });

  it("6-8 role-players get 1 werewolf", () => {
    for (const numRolePlayers of [6, 7, 8]) {
      const buckets = WEREWOLF_CONFIG.defaultRoleCount(numRolePlayers);
      const counts = bucketCounts(buckets);
      expect(counts[WerewolfRole.Werewolf]).toBe(1);
    }
  });

  it("9-11 role-players get 2 werewolves", () => {
    for (const numRolePlayers of [9, 10, 11]) {
      const buckets = WEREWOLF_CONFIG.defaultRoleCount(numRolePlayers);
      const counts = bucketCounts(buckets);
      expect(counts[WerewolfRole.Werewolf]).toBe(2);
    }
  });

  it("12-14 role-players get 3 werewolves", () => {
    for (const numRolePlayers of [12, 13, 14]) {
      const buckets = WEREWOLF_CONFIG.defaultRoleCount(numRolePlayers);
      const counts = bucketCounts(buckets);
      expect(counts[WerewolfRole.Werewolf]).toBe(3);
    }
  });

  it("total role count equals numRolePlayers", () => {
    for (let n = MIN_ROLE_PLAYERS; n <= 15; n++) {
      const buckets = WEREWOLF_CONFIG.defaultRoleCount(n);
      expect(buckets.reduce((sum, b) => sum + b.playerCount, 0)).toBe(n);
    }
  });

  it("always includes exactly 1 seer", () => {
    for (let n = MIN_ROLE_PLAYERS; n <= 15; n++) {
      const buckets = WEREWOLF_CONFIG.defaultRoleCount(n);
      const counts = bucketCounts(buckets);
      expect(counts[WerewolfRole.Seer]).toBe(1);
    }
  });
});

describe("WEREWOLF_CONFIG.isValidRoleCount", () => {
  it("returns true when total roles equals numPlayers minus one (narrator)", () => {
    const roleCounts = {
      [WerewolfRole.Werewolf]: 2,
      [WerewolfRole.Villager]: 4,
      [WerewolfRole.Seer]: 1,
    };
    expect(WEREWOLF_CONFIG.isValidRoleCount(8, roleCounts)).toBe(true);
  });

  it("returns false when total roles equals numPlayers (no narrator slot)", () => {
    const roleCounts = {
      [WerewolfRole.Werewolf]: 2,
      [WerewolfRole.Villager]: 4,
      [WerewolfRole.Seer]: 1,
    };
    expect(WEREWOLF_CONFIG.isValidRoleCount(7, roleCounts)).toBe(false);
  });
});

describe("WEREWOLF_CONFIG.resolveRoleSlotsRequired", () => {
  it("returns numPlayers - 1 when hiddenRoleCount is 0", () => {
    expect(WEREWOLF_CONFIG.resolveRoleSlotsRequired(7, defaultModeConfig)).toBe(
      6,
    );
    expect(
      WEREWOLF_CONFIG.resolveRoleSlotsRequired(10, defaultModeConfig),
    ).toBe(9);
  });

  it("returns numPlayers - 1 + hiddenRoleCount when hiddenRoleCount > 0", () => {
    expect(WEREWOLF_CONFIG.resolveRoleSlotsRequired(7, hiddenModeConfig)).toBe(
      7,
    );
    expect(WEREWOLF_CONFIG.resolveRoleSlotsRequired(10, hiddenModeConfig)).toBe(
      10,
    );
  });
});

describe("WEREWOLF_CONFIG.resolveIsValidRoleCount", () => {
  it("validates correctly with no hidden roles", () => {
    const roleCounts = {
      [WerewolfRole.Werewolf]: 1,
      [WerewolfRole.Villager]: 4,
      [WerewolfRole.Seer]: 1,
    };
    // 7 total players: 6 role slots needed (7-1)
    expect(
      WEREWOLF_CONFIG.resolveIsValidRoleCount(7, roleCounts, defaultModeConfig),
    ).toBe(true);
  });

  it("validates correctly with one hidden role", () => {
    const roleCounts = {
      [WerewolfRole.Werewolf]: 1,
      [WerewolfRole.Villager]: 4,
      [WerewolfRole.Seer]: 1,
      // extra role for the hidden slot
      [WerewolfRole.Doctor]: 1,
    };
    // 7 total players, 1 hidden: 7 role slots needed (7-1+1)
    expect(
      WEREWOLF_CONFIG.resolveIsValidRoleCount(7, roleCounts, hiddenModeConfig),
    ).toBe(true);
  });

  it("rejects when role count does not include hidden slot", () => {
    const roleCounts = {
      [WerewolfRole.Werewolf]: 1,
      [WerewolfRole.Villager]: 4,
      [WerewolfRole.Seer]: 1,
    };
    // Only 6 roles but 7 slots needed (6+1 hidden)
    expect(
      WEREWOLF_CONFIG.resolveIsValidRoleCount(7, roleCounts, hiddenModeConfig),
    ).toBe(false);
  });
});

describe("WEREWOLF_CONFIG.roleSlotsRequired", () => {
  it("returns numPlayers - 1 for backward compatibility", () => {
    expect(WEREWOLF_CONFIG.roleSlotsRequired(MIN_PLAYERS)).toBe(
      MIN_PLAYERS - 1,
    );
    expect(WEREWOLF_CONFIG.roleSlotsRequired(10)).toBe(9);
  });
});
