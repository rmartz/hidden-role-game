import { describe, it, expect } from "vitest";
import { Team } from "@/lib/types";
import type { LobbyPlayer, RoleDefinition } from "@/lib/types";
import { GameInitializationService } from "../GameInitializationService";

const service = new GameInitializationService();

type TestWerewolfRole = RoleDefinition<string, Team> & {
  teamTargeting?: boolean;
  wakesWith?: string;
  isWerewolf?: boolean;
  awareOf?: { teams?: Team[]; roles?: string[]; werewolves?: boolean };
};

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

    const result = service.buildGamePlayers(players, assignments, MOCK_ROLES);

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

    const result = service.buildGamePlayers(players, assignments, MOCK_ROLES);

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

    const result = service.buildGamePlayers(players, assignments, MOCK_ROLES);
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

    const result = service.buildGamePlayers(players, assignments, MOCK_ROLES);
    const badPlayer = result.find((p) => p.id === "p1")!;

    expect(badPlayer.visiblePlayers.every((vp) => vp.playerId !== "p1")).toBe(
      true,
    );
  });

  it("throws when a role assignment references an unknown player", () => {
    const players = [makeLobbyPlayer("p1")];
    const assignments = [{ playerId: "missing", roleDefinitionId: "good" }];

    expect(() =>
      service.buildGamePlayers(players, assignments, MOCK_ROLES),
    ).toThrow("Player not found: missing");
  });

  it("wolves see each other as wake-partners", () => {
    const players = [
      makeLobbyPlayer("w1"),
      makeLobbyPlayer("w2"),
      makeLobbyPlayer("p1"),
    ];
    const wolfRoles: Record<string, TestWerewolfRole> = {
      wolf: {
        id: "wolf",
        name: "Wolf",
        team: Team.Bad,
        teamTargeting: true,
        isWerewolf: true,
      },
      villager: { id: "villager", name: "Villager", team: Team.Good },
    };
    const assignments = [
      { playerId: "w1", roleDefinitionId: "wolf" },
      { playerId: "w2", roleDefinitionId: "wolf" },
      { playerId: "p1", roleDefinitionId: "villager" },
    ];

    const result = service.buildGamePlayers(players, assignments, wolfRoles);
    const wolf1 = result.find((p) => p.id === "w1")!;
    const wolf2 = result.find((p) => p.id === "w2")!;
    const villager = result.find((p) => p.id === "p1")!;

    expect(wolf1.visiblePlayers).toEqual([
      { playerId: "w2", reason: "wake-partner" },
    ]);
    expect(wolf2.visiblePlayers).toEqual([
      { playerId: "w1", reason: "wake-partner" },
    ]);
    expect(villager.visiblePlayers).toEqual([]);
  });

  it("minion sees werewolves via awareOf.werewolves but wolves do not see minion", () => {
    const players = [
      makeLobbyPlayer("w1"),
      makeLobbyPlayer("m1"),
      makeLobbyPlayer("p1"),
    ];
    const minionRoles: Record<string, TestWerewolfRole> = {
      wolf: {
        id: "wolf",
        name: "Wolf",
        team: Team.Bad,
        teamTargeting: true,
        isWerewolf: true,
      },
      minion: {
        id: "minion",
        name: "Minion",
        team: Team.Bad,
        awareOf: { werewolves: true },
      },
      villager: { id: "villager", name: "Villager", team: Team.Good },
    };
    const assignments = [
      { playerId: "w1", roleDefinitionId: "wolf" },
      { playerId: "m1", roleDefinitionId: "minion" },
      { playerId: "p1", roleDefinitionId: "villager" },
    ];

    const result = service.buildGamePlayers(players, assignments, minionRoles);
    const wolf = result.find((p) => p.id === "w1")!;
    const minion = result.find((p) => p.id === "m1")!;

    expect(minion.visiblePlayers).toEqual([
      { playerId: "w1", reason: "aware-of" },
    ]);
    expect(wolf.visiblePlayers).toEqual([]);
  });

  it("wakesWith role sees the primary role as a wake-partner", () => {
    const players = [
      makeLobbyPlayer("w1"),
      makeLobbyPlayer("wc1"),
      makeLobbyPlayer("p1"),
    ];
    const cubRoles: Record<string, TestWerewolfRole> = {
      wolf: {
        id: "wolf",
        name: "Wolf",
        team: Team.Bad,
        teamTargeting: true,
        isWerewolf: true,
      },
      cub: {
        id: "cub",
        name: "Wolf Cub",
        team: Team.Bad,
        wakesWith: "wolf",
        isWerewolf: true,
      },
      villager: { id: "villager", name: "Villager", team: Team.Good },
    };
    const assignments = [
      { playerId: "w1", roleDefinitionId: "wolf" },
      { playerId: "wc1", roleDefinitionId: "cub" },
      { playerId: "p1", roleDefinitionId: "villager" },
    ];

    const result = service.buildGamePlayers(players, assignments, cubRoles);
    const wolf = result.find((p) => p.id === "w1")!;
    const cub = result.find((p) => p.id === "wc1")!;

    expect(wolf.visiblePlayers).toEqual([
      { playerId: "wc1", reason: "wake-partner" },
    ]);
    expect(cub.visiblePlayers).toEqual([
      { playerId: "w1", reason: "wake-partner" },
    ]);
  });
});
