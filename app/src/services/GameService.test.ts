import { describe, it, expect } from "vitest";
import { GameService } from "./GameService";
import { GameMode, GameStatus, Team } from "@/lib/models";
import type { Game } from "@/lib/models";

function makeGame(roleAssignments: Game["roleAssignments"]): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: { type: GameStatus.Playing },
    players: [],
    roleAssignments,
    showRolesInPlay: true,
  };
}

describe("GameService.getRolesInPlay", () => {
  const service = new GameService();

  it("returns an empty array when there are no assignments", () => {
    const result = service.getRolesInPlay(makeGame([]));
    expect(result).toEqual([]);
  });

  it("returns one entry per unique role", () => {
    const game = makeGame([
      { playerId: "p1", roleDefinitionId: "good" },
      { playerId: "p2", roleDefinitionId: "good" },
      { playerId: "p3", roleDefinitionId: "bad" },
    ]);

    const result = service.getRolesInPlay(game);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toContain("good");
    expect(result.map((r) => r.id)).toContain("bad");
  });

  it("includes the correct name and team for each role", () => {
    const game = makeGame([
      { playerId: "p1", roleDefinitionId: "good" },
      { playerId: "p2", roleDefinitionId: "bad" },
    ]);

    const result = service.getRolesInPlay(game);
    const byId = Object.fromEntries(result.map((r) => [r.id, r]));

    expect(byId["good"]).toEqual({
      id: "good",
      name: "Good Role",
      team: Team.Good,
    });
    expect(byId["bad"]).toEqual({
      id: "bad",
      name: "Bad Role",
      team: Team.Bad,
    });
  });

  it("only includes roles that are actually assigned", () => {
    // special-bad exists in SecretVillain definitions but is not assigned here
    const game = makeGame([{ playerId: "p1", roleDefinitionId: "good" }]);

    const result = service.getRolesInPlay(game);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("good");
  });

  it("deduplicates even when all players share the same role", () => {
    const game = makeGame([
      { playerId: "p1", roleDefinitionId: "good" },
      { playerId: "p2", roleDefinitionId: "good" },
      { playerId: "p3", roleDefinitionId: "good" },
    ]);

    const result = service.getRolesInPlay(game);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("good");
  });

  it("skips assignments whose role definition id is not found", () => {
    const game = makeGame([
      { playerId: "p1", roleDefinitionId: "good" },
      { playerId: "p2", roleDefinitionId: "unknown-role" },
    ]);

    const result = service.getRolesInPlay(game);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("good");
  });
});
