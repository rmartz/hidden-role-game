import { describe, it, expect } from "vitest";
import { GameService } from "./GameService";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game, GamePlayer, RoleSlot } from "@/lib/types";
import {
  WerewolfPhase,
  WerewolfRole,
  TargetCategory,
  getTeamPhaseKey,
} from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";

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

// ---------------------------------------------------------------------------
// extractDaytimeNightState / extractMyLastNightTarget
// (tested indirectly via getPlayerGameState with a Werewolf daytime game)
// ---------------------------------------------------------------------------

function makeWerewolfDaytimeGame(
  overrides: Partial<{
    nightActions: WerewolfTurnState["phase"]["nightActions"];
    nightResolution: Extract<
      WerewolfTurnState["phase"],
      { type: WerewolfPhase.Daytime }
    >["nightResolution"];
    deadPlayerIds: string[];
  }> = {},
): Game {
  const turnState: WerewolfTurnState = {
    turn: 2,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: overrides.nightActions ?? {},
      ...(overrides.nightResolution !== undefined
        ? { nightResolution: overrides.nightResolution }
        : {}),
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
  };
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "owner", name: "Owner", sessionId: "s0", visibleRoles: [] },
      { id: "p1", name: "Alice", sessionId: "s1", visibleRoles: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visibleRoles: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visibleRoles: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Bodyguard },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner",
  };
}

describe("GameService.getPlayerGameState — daytime night summary", () => {
  const service = new GameService();

  it("nightSummary is absent during nighttime phase", () => {
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.Werewolf,
      status: {
        type: GameStatus.Playing,
        turnState: {
          turn: 2,
          phase: {
            type: WerewolfPhase.Nighttime,
            startedAt: 1000,
            nightPhaseOrder: [WerewolfRole.Werewolf],
            currentPhaseIndex: 0,
            nightActions: {},
          },
          deadPlayerIds: [],
        } satisfies WerewolfTurnState,
      },
      players: [{ id: "p1", name: "Alice", sessionId: "s1", visibleRoles: [] }],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      ],
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: null,
    };

    const result = service.getPlayerGameState(game, "p1");
    expect(result?.nightSummary).toBeUndefined();
  });

  it("nightSummary is absent when no players died", () => {
    const game = makeWerewolfDaytimeGame({
      nightResolution: [
        {
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: ["p3"],
          died: false,
        },
      ],
    });
    const result = service.getPlayerGameState(game, "p1");
    expect(result?.nightSummary).toBeUndefined();
  });

  it("nightSummary contains only players who died", () => {
    const game = makeWerewolfDaytimeGame({
      nightResolution: [
        {
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
        {
          targetPlayerId: "p3",
          attackedBy: ["p1"],
          protectedBy: ["p3"],
          died: false,
        },
      ],
    });
    const result = service.getPlayerGameState(game, "p1");
    expect(result?.nightSummary).toEqual([
      { targetPlayerId: "p2", died: true },
    ]);
  });

  it("nightSummary does not include attackedBy or protectedBy", () => {
    const game = makeWerewolfDaytimeGame({
      nightResolution: [
        {
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
      ],
    });
    const result = service.getPlayerGameState(game, "p1");
    const event = result?.nightSummary?.[0];
    expect(event).not.toHaveProperty("attackedBy");
    expect(event).not.toHaveProperty("protectedBy");
  });

  it("myLastNightAction reflects the Werewolf's team vote with Attack category", () => {
    const game = makeWerewolfDaytimeGame({
      nightActions: {
        [getTeamPhaseKey(Team.Bad)]: {
          votes: [{ playerId: "p1", targetPlayerId: "p3" }],
          confirmed: true,
        },
      },
    });
    const result = service.getPlayerGameState(game, "p1");
    expect(result?.myLastNightAction).toEqual({
      targetPlayerId: "p3",
      category: TargetCategory.Attack,
    });
  });

  it("myLastNightAction reflects the Seer's target with Investigate category", () => {
    const game = makeWerewolfDaytimeGame({
      nightActions: {
        [WerewolfRole.Seer]: { targetPlayerId: "p1", confirmed: true },
      },
    });
    const result = service.getPlayerGameState(game, "p2");
    expect(result?.myLastNightAction).toEqual({
      targetPlayerId: "p1",
      category: TargetCategory.Investigate,
    });
  });

  it("myLastNightAction reflects the Bodyguard's target with Protect category", () => {
    const game = makeWerewolfDaytimeGame({
      nightActions: {
        [WerewolfRole.Bodyguard]: { targetPlayerId: "p1", confirmed: true },
      },
    });
    const result = service.getPlayerGameState(game, "p3");
    expect(result?.myLastNightAction).toEqual({
      targetPlayerId: "p1",
      category: TargetCategory.Protect,
    });
  });

  it("myLastNightAction is absent when player took no action", () => {
    const game = makeWerewolfDaytimeGame({ nightActions: {} });
    const result = service.getPlayerGameState(game, "p1");
    expect(result?.myLastNightAction).toBeUndefined();
  });

  it("narrator never receives nightSummary or myLastNightAction", () => {
    const game = makeWerewolfDaytimeGame({
      nightResolution: [
        {
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
      ],
      nightActions: {
        [WerewolfRole.Werewolf]: { targetPlayerId: "p2", confirmed: true },
      },
    });
    const result = service.getPlayerGameState(game, "owner");
    expect(result?.nightSummary).toBeUndefined();
    expect(result?.myLastNightAction).toBeUndefined();
  });
});
