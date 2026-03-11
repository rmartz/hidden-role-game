import { describe, it, expect } from "vitest";
import { GameService } from "./GameService";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game, GamePlayer, RoleSlot } from "@/lib/types";

const DEFAULT_SLOTS: RoleSlot[] = [
  { roleId: "good", min: 1, max: 1 },
  { roleId: "bad", min: 1, max: 1 },
];

function makePlayer(
  id: string,
  visibleRoles: GamePlayer["visibleRoles"] = [],
): GamePlayer {
  return { id, name: `Player ${id}`, sessionId: `session-${id}`, visibleRoles };
}

function makeGameWithPlayers(
  players: GamePlayer[],
  roleAssignments: Game["roleAssignments"],
  showRolesInPlay: ShowRolesInPlay = ShowRolesInPlay.RoleAndCount,
  configuredRoleSlots: RoleSlot[] = DEFAULT_SLOTS,
): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: { type: GameStatus.Playing },
    players,
    roleAssignments,
    configuredRoleSlots,
    showRolesInPlay,
    ownerPlayerId: null,
  };
}

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

  it("rolesInPlay includes count when showRolesInPlay is RoleAndCount", () => {
    const game = makeGameWithPlayers(
      [makePlayer("p1")],
      [{ playerId: "p1", roleDefinitionId: "good" }],
      ShowRolesInPlay.RoleAndCount,
    );

    const result = service.getPlayerGameState(game, "p1");

    expect(result?.rolesInPlay).not.toBeNull();
    expect(result?.rolesInPlay).toContainEqual(
      expect.objectContaining({
        id: "good",
        name: "Good Role",
        team: Team.Good,
        count: 1,
      }),
    );
  });

  it("rolesInPlay is null when showRolesInPlay is None", () => {
    const game = makeGameWithPlayers(
      [makePlayer("p1")],
      [{ playerId: "p1", roleDefinitionId: "good" }],
      ShowRolesInPlay.None,
    );

    const result = service.getPlayerGameState(game, "p1");

    expect(result?.rolesInPlay).toBeNull();
  });

  it("rolesInPlay shows assigned roles without count for AssignedRolesOnly", () => {
    const slots: RoleSlot[] = [{ roleId: "good", min: 1, max: 3 }];
    const game = makeGameWithPlayers(
      [makePlayer("p1"), makePlayer("p2")],
      [
        { playerId: "p1", roleDefinitionId: "good" },
        { playerId: "p2", roleDefinitionId: "good" },
      ],
      ShowRolesInPlay.AssignedRolesOnly,
      slots,
    );

    const result = service.getPlayerGameState(game, "p1");

    expect(result?.rolesInPlay).toHaveLength(1);
    expect(result?.rolesInPlay?.[0]).toEqual({
      id: "good",
      name: "Good Role",
      team: Team.Good,
      min: 1,
      max: 3,
    });
  });

  it("rolesInPlay shows configured slots for ConfiguredOnly", () => {
    const slots: RoleSlot[] = [
      { roleId: "good", min: 2, max: 4 },
      { roleId: "bad", min: 0, max: 2 },
    ];
    // Only "good" is assigned, but both are configured
    const game = makeGameWithPlayers(
      [makePlayer("p1")],
      [{ playerId: "p1", roleDefinitionId: "good" }],
      ShowRolesInPlay.ConfiguredOnly,
      slots,
    );

    const result = service.getPlayerGameState(game, "p1");

    expect(result?.rolesInPlay).toHaveLength(2);
    expect(result?.rolesInPlay).toContainEqual(
      expect.objectContaining({ id: "good", min: 2, max: 4 }),
    );
    expect(result?.rolesInPlay).toContainEqual(
      expect.objectContaining({ id: "bad", min: 0, max: 2 }),
    );
  });
});
