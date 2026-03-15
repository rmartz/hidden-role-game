import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game, LobbyPlayer, RoleSlot } from "@/lib/types";
import { WerewolfPhase, WerewolfRole } from "@/lib/game-modes/werewolf";
import { SecretVillainRole } from "@/lib/game-modes/secret-villain";
import { GameInitializationService } from "./GameInitializationService";

const service = new GameInitializationService();

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeLobbyPlayer(id: string): LobbyPlayer {
  return { id, name: `Player ${id}`, sessionId: `session-${id}` };
}

const MOCK_ROLES = {
  good: { id: "good", name: "Good Role", team: Team.Good },
  bad: {
    id: "bad",
    name: "Bad Role",
    team: Team.Bad,
    canSeeTeam: [Team.Bad],
  },
  special: { id: "special", name: "Special Role", team: Team.Bad },
};

const DEFAULT_SLOTS: RoleSlot[] = [
  { roleId: SecretVillainRole.Good, min: 1, max: 1 },
  { roleId: SecretVillainRole.Bad, min: 1, max: 1 },
];

function makeSecretVillainGame(
  roleAssignments: Game["roleAssignments"],
  showRolesInPlay: ShowRolesInPlay = ShowRolesInPlay.RoleAndCount,
  configuredRoleSlots: RoleSlot[] = DEFAULT_SLOTS,
): Game {
  const players = roleAssignments.map((a) => ({
    id: a.playerId,
    name: `Player ${a.playerId}`,
    sessionId: `session-${a.playerId}`,
    visibleRoles: [],
  }));
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: { type: GameStatus.Playing },
    players,
    roleAssignments,
    configuredRoleSlots,
    showRolesInPlay,
    ownerPlayerId: undefined,
  };
}

// ---------------------------------------------------------------------------
// buildGamePlayers
// ---------------------------------------------------------------------------

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

  it("player with no team/role visibility has empty visibleRoles", () => {
    const players = [makeLobbyPlayer("p1"), makeLobbyPlayer("p2")];
    const assignments = [
      { playerId: "p1", roleDefinitionId: "good" },
      { playerId: "p2", roleDefinitionId: "good" },
    ];

    const result = service.buildGamePlayers(players, assignments, MOCK_ROLES);

    expect(result[0]!.visibleRoles).toEqual([]);
  });

  it("bad role (canSeeTeam: Bad) can see other bad players", () => {
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

    // sees p2 (also bad) but not p3 (good)
    expect(badPlayer.visibleRoles).toHaveLength(1);
    expect(badPlayer.visibleRoles[0]!.playerId).toBe("p2");
  });

  it("player does not see themselves in visibleRoles", () => {
    const players = [makeLobbyPlayer("p1"), makeLobbyPlayer("p2")];
    const assignments = [
      { playerId: "p1", roleDefinitionId: "bad" },
      { playerId: "p2", roleDefinitionId: "special" },
    ];

    // bad has canSeeTeam: [Bad]; special is also Bad
    const result = service.buildGamePlayers(players, assignments, MOCK_ROLES);
    const badPlayer = result.find((p) => p.id === "p1")!;

    expect(badPlayer.visibleRoles.every((vr) => vr.playerId !== "p1")).toBe(
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
});

// ---------------------------------------------------------------------------
// buildInitialTurnState
// ---------------------------------------------------------------------------

describe("GameInitializationService.buildInitialTurnState", () => {
  it("returns undefined for non-Werewolf modes", () => {
    expect(
      service.buildInitialTurnState(GameMode.SecretVillain, []),
    ).toBeUndefined();
    expect(service.buildInitialTurnState(GameMode.Avalon, [])).toBeUndefined();
  });

  it("returns a WerewolfTurnState for Werewolf mode", () => {
    const assignments = [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
    ];

    const result = service.buildInitialTurnState(
      GameMode.Werewolf,
      assignments,
    );

    expect(result).toBeDefined();
    expect(result?.turn).toBe(1);
    expect(result?.deadPlayerIds).toEqual([]);
    expect(result?.phase.type).toBe(WerewolfPhase.Nighttime);
  });

  it("nightPhaseOrder is built from the role assignments", () => {
    const assignments = [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
    ];

    const result = service.buildInitialTurnState(
      GameMode.Werewolf,
      assignments,
    );

    expect(
      result?.phase.type === WerewolfPhase.Nighttime &&
        result.phase.nightPhaseOrder.length,
    ).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// buildRolesInPlay
// ---------------------------------------------------------------------------

describe("GameInitializationService.buildRolesInPlay", () => {
  it("returns undefined when showRolesInPlay is None", () => {
    const game = makeSecretVillainGame(
      [{ playerId: "p1", roleDefinitionId: SecretVillainRole.Good }],
      ShowRolesInPlay.None,
    );

    expect(service.buildRolesInPlay(game)).toBeUndefined();
  });

  it("returns roles with count when showRolesInPlay is RoleAndCount", () => {
    const game = makeSecretVillainGame(
      [
        { playerId: "p1", roleDefinitionId: SecretVillainRole.Good },
        { playerId: "p2", roleDefinitionId: SecretVillainRole.Good },
        { playerId: "p3", roleDefinitionId: SecretVillainRole.Bad },
      ],
      ShowRolesInPlay.RoleAndCount,
      [
        { roleId: SecretVillainRole.Good, min: 2, max: 2 },
        { roleId: SecretVillainRole.Bad, min: 1, max: 1 },
      ],
    );

    const result = service.buildRolesInPlay(game);

    expect(result).toBeDefined();
    expect(result).toContainEqual(
      expect.objectContaining({
        id: SecretVillainRole.Good,
        count: 2,
      }),
    );
    expect(result).toContainEqual(
      expect.objectContaining({
        id: SecretVillainRole.Bad,
        count: 1,
      }),
    );
  });

  it("returns unique roles without count for AssignedRolesOnly", () => {
    const slots: RoleSlot[] = [
      { roleId: SecretVillainRole.Good, min: 1, max: 3 },
    ];
    const game = makeSecretVillainGame(
      [
        { playerId: "p1", roleDefinitionId: SecretVillainRole.Good },
        { playerId: "p2", roleDefinitionId: SecretVillainRole.Good },
      ],
      ShowRolesInPlay.AssignedRolesOnly,
      slots,
    );

    const result = service.buildRolesInPlay(game);

    expect(result).toHaveLength(1);
    expect(result?.[0]).toEqual({
      id: SecretVillainRole.Good,
      name: "Good Role",
      team: Team.Good,
      min: 1,
      max: 3,
    });
    expect(result?.[0]).not.toHaveProperty("count");
  });

  it("returns configured slots for ConfiguredOnly", () => {
    const slots: RoleSlot[] = [
      { roleId: SecretVillainRole.Good, min: 2, max: 4 },
      { roleId: SecretVillainRole.Bad, min: 0, max: 2 },
    ];
    const game = makeSecretVillainGame(
      [{ playerId: "p1", roleDefinitionId: SecretVillainRole.Good }],
      ShowRolesInPlay.ConfiguredOnly,
      slots,
    );

    const result = service.buildRolesInPlay(game);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(
      expect.objectContaining({ id: SecretVillainRole.Good, min: 2, max: 4 }),
    );
    expect(result).toContainEqual(
      expect.objectContaining({ id: SecretVillainRole.Bad, min: 0, max: 2 }),
    );
  });

  it("ConfiguredOnly excludes slots with max === 0", () => {
    const slots: RoleSlot[] = [
      { roleId: SecretVillainRole.Good, min: 1, max: 3 },
      { roleId: SecretVillainRole.Bad, min: 0, max: 0 },
    ];
    const game = makeSecretVillainGame(
      [{ playerId: "p1", roleDefinitionId: SecretVillainRole.Good }],
      ShowRolesInPlay.ConfiguredOnly,
      slots,
    );

    const result = service.buildRolesInPlay(game);

    expect(result).toHaveLength(1);
    expect(result?.[0]!.id).toBe(SecretVillainRole.Good);
  });
});
