import { describe, it, expect } from "vitest";
import { GameService } from "./GameService";
import { GameMode, GameStatus, Team } from "@/lib/models";
import type { Game, GamePlayer } from "@/lib/models";

function makeGame(roleAssignments: Game["roleAssignments"]): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: { type: GameStatus.Playing },
    players: [],
    roleAssignments,
    showRolesInPlay: true,
    ownerPlayerId: null,
  };
}

function makePlayer(
  id: string,
  visibleRoles: GamePlayer["visibleRoles"] = [],
): GamePlayer {
  return { id, name: `Player ${id}`, sessionId: `session-${id}`, visibleRoles };
}

function makeGameWithPlayers(
  players: GamePlayer[],
  roleAssignments: Game["roleAssignments"],
  showRolesInPlay = true,
): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: { type: GameStatus.Playing },
    players,
    roleAssignments,
    showRolesInPlay,
    ownerPlayerId: null,
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

describe("GameService.getPlayerGameState", () => {
  const service = new GameService();

  it("returns null when callerId is not in game.players", () => {
    const game = makeGameWithPlayers(
      [makePlayer("p1")],
      [{ playerId: "p1", roleDefinitionId: "good" }],
    );

    expect(service.getPlayerGameState(game, "unknown")).toBeNull();
  });

  it("returns null when caller has no role assignment", () => {
    const game = makeGameWithPlayers([makePlayer("p1")], []);

    expect(service.getPlayerGameState(game, "p1")).toBeNull();
  });

  it("returns null when caller's role definition does not exist", () => {
    const game = makeGameWithPlayers(
      [makePlayer("p1")],
      [{ playerId: "p1", roleDefinitionId: "unknown-role" }],
    );

    expect(service.getPlayerGameState(game, "p1")).toBeNull();
  });

  it("returns correct status, player list, and myRole", () => {
    const game = makeGameWithPlayers(
      [makePlayer("p1"), makePlayer("p2")],
      [
        { playerId: "p1", roleDefinitionId: "good" },
        { playerId: "p2", roleDefinitionId: "bad" },
      ],
    );

    const result = service.getPlayerGameState(game, "p1");

    expect(result?.status).toEqual({ type: GameStatus.Playing });
    expect(result?.players).toEqual([
      { id: "p1", name: "Player p1" },
      { id: "p2", name: "Player p2" },
    ]);
    expect(result?.myRole).toEqual({
      id: "good",
      name: "Good Role",
      team: Team.Good,
    });
  });

  it("visibleRoleAssignments is empty when caller has no visible roles", () => {
    const game = makeGameWithPlayers(
      [makePlayer("p1", [])],
      [{ playerId: "p1", roleDefinitionId: "good" }],
    );

    const result = service.getPlayerGameState(game, "p1");

    expect(result?.visibleRoleAssignments).toEqual([]);
  });

  it("visibleRoleAssignments lists teammates from caller's visibleRoles", () => {
    const p2 = makePlayer("p2");
    const p1 = makePlayer("p1", [{ playerId: "p2", roleDefinitionId: "bad" }]);
    const game = makeGameWithPlayers(
      [p1, p2],
      [
        { playerId: "p1", roleDefinitionId: "bad" },
        { playerId: "p2", roleDefinitionId: "bad" },
      ],
    );

    const result = service.getPlayerGameState(game, "p1");

    expect(result?.visibleRoleAssignments).toEqual([
      {
        player: { id: "p2", name: "Player p2" },
        role: { id: "bad", name: "Bad Role", team: Team.Bad },
      },
    ]);
  });

  it("rolesInPlay is populated when showRolesInPlay is true", () => {
    const game = makeGameWithPlayers(
      [makePlayer("p1")],
      [{ playerId: "p1", roleDefinitionId: "good" }],
      true,
    );

    const result = service.getPlayerGameState(game, "p1");

    expect(result?.rolesInPlay).not.toBeNull();
    expect(result?.rolesInPlay).toContainEqual({
      id: "good",
      name: "Good Role",
      team: Team.Good,
    });
  });

  it("rolesInPlay is null when showRolesInPlay is false", () => {
    const game = makeGameWithPlayers(
      [makePlayer("p1")],
      [{ playerId: "p1", roleDefinitionId: "good" }],
      false,
    );

    const result = service.getPlayerGameState(game, "p1");

    expect(result?.rolesInPlay).toBeNull();
  });
});
