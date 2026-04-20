import { describe, it, expect } from "vitest";
import { Team, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import {
  CodenamesRole,
  CODENAMES_ROLES,
  defaultRoleCount,
  getCodenamesRole,
  isCodenamesRole,
  MIN_PLAYERS,
  CODENAMES_CONFIG,
} from "./index";

describe("CodenamesRole enum", () => {
  it("has exactly four roles", () => {
    expect(Object.values(CodenamesRole)).toHaveLength(4);
  });

  it("all role IDs are prefixed with 'codenames-'", () => {
    for (const id of Object.values(CodenamesRole)) {
      expect(id).toMatch(/^codenames-/);
    }
  });
});

describe("CODENAMES_ROLES", () => {
  it("contains an entry for every CodenamesRole", () => {
    for (const role of Object.values(CodenamesRole)) {
      expect(CODENAMES_ROLES[role]).toBeDefined();
    }
  });

  it("Red roles belong to Team.Good", () => {
    expect(CODENAMES_ROLES[CodenamesRole.RedCodemaster].team).toBe(Team.Good);
    expect(CODENAMES_ROLES[CodenamesRole.RedGuesser].team).toBe(Team.Good);
  });

  it("Blue roles belong to Team.Bad", () => {
    expect(CODENAMES_ROLES[CodenamesRole.BlueCodemaster].team).toBe(Team.Bad);
    expect(CODENAMES_ROLES[CodenamesRole.BlueGuesser].team).toBe(Team.Bad);
  });

  it("Codemaster roles are unique", () => {
    expect(CODENAMES_ROLES[CodenamesRole.RedCodemaster].unique).toBe(true);
    expect(CODENAMES_ROLES[CodenamesRole.BlueCodemaster].unique).toBe(true);
  });

  it("Guesser roles are not unique", () => {
    expect(CODENAMES_ROLES[CodenamesRole.RedGuesser].unique).toBeUndefined();
    expect(CODENAMES_ROLES[CodenamesRole.BlueGuesser].unique).toBeUndefined();
  });
});

describe("isCodenamesRole", () => {
  it("returns true for valid Codenames role IDs", () => {
    expect(isCodenamesRole(CodenamesRole.RedCodemaster)).toBe(true);
    expect(isCodenamesRole(CodenamesRole.BlueGuesser)).toBe(true);
  });

  it("returns false for unknown IDs", () => {
    expect(isCodenamesRole("werewolf-villager")).toBe(false);
    expect(isCodenamesRole("")).toBe(false);
  });
});

describe("getCodenamesRole", () => {
  it("returns the role definition for a valid ID", () => {
    const role = getCodenamesRole(CodenamesRole.RedCodemaster);
    expect(role?.id).toBe(CodenamesRole.RedCodemaster);
  });

  it("returns undefined for an unknown ID", () => {
    expect(getCodenamesRole("unknown-role")).toBeUndefined();
  });
});

describe("defaultRoleCount", () => {
  it("returns 4 role slots for the minimum player count", () => {
    const buckets = defaultRoleCount(MIN_PLAYERS);
    const total = buckets.reduce((sum, b) => sum + b.playerCount, 0);
    expect(total).toBe(MIN_PLAYERS);
  });

  it("includes exactly one Red Codemaster and one Blue Codemaster", () => {
    const buckets = defaultRoleCount(MIN_PLAYERS);
    const redCM = buckets.find(
      (b) =>
        "roleId" in b && b.roleId === (CodenamesRole.RedCodemaster as string),
    );
    const blueCM = buckets.find(
      (b) =>
        "roleId" in b && b.roleId === (CodenamesRole.BlueCodemaster as string),
    );
    expect(redCM?.playerCount).toBe(1);
    expect(blueCM?.playerCount).toBe(1);
  });

  it("distributes extra players as Guessers for 6 players", () => {
    const buckets = defaultRoleCount(6);
    const total = buckets.reduce((sum, b) => sum + b.playerCount, 0);
    expect(total).toBe(6);
    const redGuesser = buckets.find(
      (b) => "roleId" in b && b.roleId === (CodenamesRole.RedGuesser as string),
    );
    const blueGuesser = buckets.find(
      (b) =>
        "roleId" in b && b.roleId === (CodenamesRole.BlueGuesser as string),
    );
    // 2 extra guessers: Red gets ceil(2/2)=1 extra, Blue gets floor(2/2)=1 extra
    expect(redGuesser?.playerCount).toBe(2);
    expect(blueGuesser?.playerCount).toBe(2);
  });

  it("clamps to MIN_PLAYERS when given fewer players", () => {
    const buckets = defaultRoleCount(2);
    const total = buckets.reduce((sum, b) => sum + b.playerCount, 0);
    expect(total).toBe(MIN_PLAYERS);
  });
});

describe("CODENAMES_CONFIG", () => {
  it("has the correct name", () => {
    expect(CODENAMES_CONFIG.name).toBe("Codenames");
  });

  it("is not released", () => {
    expect(CODENAMES_CONFIG.released).toBe(false);
  });

  it("requires at least MIN_PLAYERS", () => {
    expect(CODENAMES_CONFIG.minPlayers).toBe(MIN_PLAYERS);
  });

  it("has no owner title (no narrator)", () => {
    expect(CODENAMES_CONFIG.ownerTitle).toBeNull();
  });

  it("labels Red and Blue teams", () => {
    expect(CODENAMES_CONFIG.teamLabels[Team.Good]).toBe("Red");
    expect(CODENAMES_CONFIG.teamLabels[Team.Bad]).toBe("Blue");
  });

  it("buildDefaultLobbyConfig returns a config with Codenames game mode", () => {
    const base = {
      roleConfigMode: RoleConfigMode.Default,
      roleBuckets: [],
      showConfigToPlayers: false,
      showRolesInPlay: ShowRolesInPlay.None,
    };
    const config = CODENAMES_CONFIG.buildDefaultLobbyConfig(base);
    expect(config.gameMode).toBe("codenames");
  });

  it("parseModeConfig returns a Codenames mode config", () => {
    const result = CODENAMES_CONFIG.parseModeConfig({});
    expect(result.gameMode).toBe("codenames");
  });
});
