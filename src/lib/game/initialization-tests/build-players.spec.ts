import { describe, it, expect } from "vitest";
import { Team } from "@/lib/types";
import type { LobbyPlayer } from "@/lib/types";
import { buildGamePlayers } from "../initialization";

function makeLobbyPlayer(id: string): LobbyPlayer {
  return { id, name: `Player ${id}`, sessionId: `session-${id}` };
}

const MOCK_ROLES = {
  good: { id: "good", name: "Good Role", team: Team.Good },
  bad: {
    id: "bad",
    name: "Bad Role",
    team: Team.Bad,
    awareOf: { teams: [Team.Bad] },
  },
  special: { id: "special", name: "Special Role", team: Team.Bad },
};

describe("GameInitializationService.buildGamePlayers", () => {
  it("returns a GamePlayer for each role assignment", () => {
    const players = [makeLobbyPlayer("p1"), makeLobbyPlayer("p2")];
    const assignments = [
      { playerId: "p1", roleDefinitionId: "good" },
      { playerId: "p2", roleDefinitionId: "bad" },
    ];

    const result = buildGamePlayers(players, assignments, MOCK_ROLES);

    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe("p1");
    expect(result[1]!.id).toBe("p2");
  });

  it("player with no visibility has empty visiblePlayers", () => {
    const players = [makeLobbyPlayer("p1"), makeLobbyPlayer("p2")];
    const assignments = [
      { playerId: "p1", roleDefinitionId: "good" },
      { playerId: "p2", roleDefinitionId: "good" },
    ];

    const result = buildGamePlayers(players, assignments, MOCK_ROLES);

    expect(result[0]!.visiblePlayers).toEqual([]);
  });

  it("bad role (awareOf teams: Bad) can see other bad players", () => {
    const players = [
      makeLobbyPlayer("p1"),
      makeLobbyPlayer("p2"),
      makeLobbyPlayer("p3"),
    ];
    const assignments = [
      { playerId: "p1", roleDefinitionId: "bad" },
      { playerId: "p2", roleDefinitionId: "bad" },
      { playerId: "p3", roleDefinitionId: "good" },
    ];

    const result = buildGamePlayers(players, assignments, MOCK_ROLES);
    const badPlayer = result.find((p) => p.id === "p1")!;

    expect(badPlayer.visiblePlayers).toHaveLength(1);
    expect(badPlayer.visiblePlayers[0]!.playerId).toBe("p2");
    expect(badPlayer.visiblePlayers[0]!.reason).toBe("aware-of");
  });

  it("player does not see themselves in visiblePlayers", () => {
    const players = [makeLobbyPlayer("p1"), makeLobbyPlayer("p2")];
    const assignments = [
      { playerId: "p1", roleDefinitionId: "bad" },
      { playerId: "p2", roleDefinitionId: "special" },
    ];

    const result = buildGamePlayers(players, assignments, MOCK_ROLES);
    const badPlayer = result.find((p) => p.id === "p1")!;

    expect(badPlayer.visiblePlayers.every((vp) => vp.playerId !== "p1")).toBe(
      true,
    );
  });

  it("throws when a role assignment references an unknown player", () => {
    const players = [makeLobbyPlayer("p1")];
    const assignments = [{ playerId: "missing", roleDefinitionId: "good" }];

    expect(() => buildGamePlayers(players, assignments, MOCK_ROLES)).toThrow(
      "Player not found: missing",
    );
  });
});

describe("buildGamePlayers — excludeRoles", () => {
  const ROLES_WITH_EXCLUDE = {
    merlin: {
      id: "merlin",
      name: "Merlin",
      team: Team.Good,
      awareOf: { teams: [Team.Bad], excludeRoles: ["mordred"] },
    },
    minion: { id: "minion", name: "Minion", team: Team.Bad },
    mordred: { id: "mordred", name: "Mordred", team: Team.Bad },
  };

  it("excludes the specified role from team-based awareness", () => {
    const players = [
      makeLobbyPlayer("p1"),
      makeLobbyPlayer("p2"),
      makeLobbyPlayer("p3"),
    ];
    const assignments = [
      { playerId: "p1", roleDefinitionId: "merlin" },
      { playerId: "p2", roleDefinitionId: "minion" },
      { playerId: "p3", roleDefinitionId: "mordred" },
    ];

    const result = buildGamePlayers(players, assignments, ROLES_WITH_EXCLUDE);
    const merlin = result.find((p) => p.id === "p1")!;

    expect(merlin.visiblePlayers).toHaveLength(1);
    expect(merlin.visiblePlayers[0]!.playerId).toBe("p2");
  });

  it("excluded role still appears in other team members' awareness", () => {
    const EVIL_ROLES = {
      minion: {
        id: "minion",
        name: "Minion",
        team: Team.Bad,
        awareOf: { teams: [Team.Bad], excludeRoles: ["oberon"] },
      },
      mordred: {
        id: "mordred",
        name: "Mordred",
        team: Team.Bad,
        awareOf: { teams: [Team.Bad], excludeRoles: ["oberon"] },
      },
      oberon: { id: "oberon", name: "Oberon", team: Team.Bad },
    };
    const players = [
      makeLobbyPlayer("p1"),
      makeLobbyPlayer("p2"),
      makeLobbyPlayer("p3"),
    ];
    const assignments = [
      { playerId: "p1", roleDefinitionId: "minion" },
      { playerId: "p2", roleDefinitionId: "mordred" },
      { playerId: "p3", roleDefinitionId: "oberon" },
    ];

    const result = buildGamePlayers(players, assignments, EVIL_ROLES);
    const minion = result.find((p) => p.id === "p1")!;
    const oberon = result.find((p) => p.id === "p3")!;

    expect(minion.visiblePlayers.map((vp) => vp.playerId)).toEqual(["p2"]);
    expect(oberon.visiblePlayers).toHaveLength(0);
  });
});

describe("buildGamePlayers — revealRole on role matches", () => {
  const PERCIVAL_ROLES = {
    percival: {
      id: "percival",
      name: "Percival",
      team: Team.Good,
      awareOf: {
        roles: ["merlin", "morgana"],
        revealRole: false,
      },
    },
    merlin: { id: "merlin", name: "Merlin", team: Team.Good },
    morgana: { id: "morgana", name: "Morgana", team: Team.Bad },
  };

  it("role matches do not include roleId when revealRole is false", () => {
    const players = [
      makeLobbyPlayer("p1"),
      makeLobbyPlayer("p2"),
      makeLobbyPlayer("p3"),
    ];
    const assignments = [
      { playerId: "p1", roleDefinitionId: "percival" },
      { playerId: "p2", roleDefinitionId: "merlin" },
      { playerId: "p3", roleDefinitionId: "morgana" },
    ];

    const result = buildGamePlayers(players, assignments, PERCIVAL_ROLES);
    const percival = result.find((p) => p.id === "p1")!;

    expect(percival.visiblePlayers).toHaveLength(2);
    expect(percival.visiblePlayers[0]!.roleId).toBeUndefined();
    expect(percival.visiblePlayers[1]!.roleId).toBeUndefined();
  });

  it("role matches include roleId by default (no revealRole set)", () => {
    const SENTINEL_ROLES = {
      sentinel: {
        id: "sentinel",
        name: "Sentinel",
        team: Team.Good,
        awareOf: { roles: ["seer"] },
      },
      seer: { id: "seer", name: "Seer", team: Team.Good },
    };
    const players = [makeLobbyPlayer("p1"), makeLobbyPlayer("p2")];
    const assignments = [
      { playerId: "p1", roleDefinitionId: "sentinel" },
      { playerId: "p2", roleDefinitionId: "seer" },
    ];

    const result = buildGamePlayers(players, assignments, SENTINEL_ROLES);
    const sentinel = result.find((p) => p.id === "p1")!;

    expect(sentinel.visiblePlayers[0]!.roleId).toBe("seer");
  });
});
