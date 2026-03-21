import { describe, it, expect } from "vitest";
import {
  GameMode,
  GameStatus,
  ShowRolesInPlay,
  Team,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { Game, LobbyPlayer, RoleDefinition, RoleSlot } from "@/lib/types";
import { WerewolfPhase, WerewolfRole } from "@/lib/game-modes/werewolf";
import { SecretVillainRole } from "@/lib/game-modes/secret-villain";
import { GameInitializationService } from "./GameInitializationService";

const service = new GameInitializationService();

/** Extended role type for werewolf-specific test fixtures. */
type TestWerewolfRole = RoleDefinition<string, Team> & {
  teamTargeting?: boolean;
  wakesWith?: string;
  isWerewolf?: boolean;
  awareOf?: { teams?: Team[]; roles?: string[]; werewolves?: boolean };
};

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
    awareOf: { teams: [Team.Bad] },
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
    visiblePlayers: [],
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
    nominationsEnabled: false,
    singleTrialPerDay: true,
    timerConfig: DEFAULT_TIMER_CONFIG,
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

    // sees p2 (also bad) but not p3 (good)
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

    // bad has awareOf teams: [Bad]; special is also Bad
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
