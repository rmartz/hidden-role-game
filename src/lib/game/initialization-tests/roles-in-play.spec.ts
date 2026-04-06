import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game, RoleSlot } from "@/lib/types";
import { SecretVillainRole } from "@/lib/game/modes/secret-villain";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import { DEFAULT_SECRET_VILLAIN_MODE_CONFIG } from "@/lib/game/modes/secret-villain/lobby-config";
import { buildRolesInPlay } from "../initialization";

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
        { roleId: SecretVillainRole.Good, min: 2, max: 2 },
        { roleId: SecretVillainRole.Bad, min: 1, max: 1 },
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

    const result = buildRolesInPlay(game);

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

    const result = buildRolesInPlay(game);

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

    const result = buildRolesInPlay(game);

    expect(result).toHaveLength(1);
    expect(result?.[0]!.id).toBe(SecretVillainRole.Good);
  });
});
