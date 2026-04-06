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
