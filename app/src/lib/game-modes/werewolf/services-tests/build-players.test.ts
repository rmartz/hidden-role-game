import { describe, it, expect } from "vitest";
import { Team } from "@/lib/types";
import type { LobbyPlayer, RoleDefinition } from "@/lib/types";
import { GameInitializationService } from "@/services/GameInitializationService";

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

describe("GameInitializationService.buildGamePlayers (Werewolf-specific)", () => {
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
