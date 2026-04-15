import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game, RoleBucket } from "@/lib/types";
import { SecretVillainRole } from "@/lib/game/modes/secret-villain";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import { DEFAULT_SECRET_VILLAIN_MODE_CONFIG } from "@/lib/game/modes/secret-villain/lobby-config";
import { buildRolesInPlay } from "../initialization";

const DEFAULT_BUCKETS: RoleBucket[] = [
  { playerCount: 1, roles: [{ roleId: SecretVillainRole.Good, min: 1 }] },
  { playerCount: 1, roles: [{ roleId: SecretVillainRole.Bad, min: 1 }] },
];

function makeSecretVillainGame(
  roleAssignments: Game["roleAssignments"],
  showRolesInPlay: ShowRolesInPlay = ShowRolesInPlay.RoleAndCount,
  configuredRoleBuckets: RoleBucket[] = DEFAULT_BUCKETS,
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
    configuredRoleBuckets,
    showRolesInPlay,
    ownerPlayerId: undefined,
    modeConfig: DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
  };
}

describe("GameInitializationService.buildRolesInPlay", () => {
  it("returns undefined when showRolesInPlay is None", () => {
    const game = makeSecretVillainGame(
      [{ playerId: "p1", roleDefinitionId: SecretVillainRole.Good }],
      ShowRolesInPlay.None,
    );

    expect(buildRolesInPlay(game)).toBeUndefined();
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
        { playerCount: 2, roles: [{ roleId: SecretVillainRole.Good, min: 1 }] },
        { playerCount: 1, roles: [{ roleId: SecretVillainRole.Bad, min: 1 }] },
      ],
    );

    const result = buildRolesInPlay(game);

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
    const buckets: RoleBucket[] = [
      { playerCount: 2, roles: [{ roleId: SecretVillainRole.Good, min: 1 }] },
    ];
    const game = makeSecretVillainGame(
      [
        { playerId: "p1", roleDefinitionId: SecretVillainRole.Good },
        { playerId: "p2", roleDefinitionId: SecretVillainRole.Good },
      ],
      ShowRolesInPlay.AssignedRolesOnly,
      buckets,
    );

    const result = buildRolesInPlay(game);

    expect(result).toHaveLength(1);
    expect(result?.[0]).toEqual({
      id: SecretVillainRole.Good,
      name: "Good Role",
      team: Team.Good,
      min: 1,
      max: 1,
    });
    expect(result?.[0]).not.toHaveProperty("count");
  });

  it("returns configured roles for ConfiguredOnly", () => {
    const buckets: RoleBucket[] = [
      { playerCount: 2, roles: [{ roleId: SecretVillainRole.Good, min: 1 }] },
      { playerCount: 1, roles: [{ roleId: SecretVillainRole.Bad, min: 1 }] },
    ];
    const game = makeSecretVillainGame(
      [{ playerId: "p1", roleDefinitionId: SecretVillainRole.Good }],
      ShowRolesInPlay.ConfiguredOnly,
      buckets,
    );

    const result = buildRolesInPlay(game);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(
      expect.objectContaining({ id: SecretVillainRole.Good, min: 1 }),
    );
    expect(result).toContainEqual(
      expect.objectContaining({ id: SecretVillainRole.Bad, min: 1 }),
    );
  });

  it("ConfiguredOnly shows all roles present in configuredRoleBuckets", () => {
    const buckets: RoleBucket[] = [
      { playerCount: 3, roles: [{ roleId: SecretVillainRole.Good, min: 1 }] },
    ];
    const game = makeSecretVillainGame(
      [{ playerId: "p1", roleDefinitionId: SecretVillainRole.Good }],
      ShowRolesInPlay.ConfiguredOnly,
      buckets,
    );

    const result = buildRolesInPlay(game);

    expect(result).toHaveLength(1);
    expect(result?.[0]!.id).toBe(SecretVillainRole.Good);
  });
});
