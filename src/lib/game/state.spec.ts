import { describe, it, expect } from "vitest";
import { getPlayerGameState } from "./state";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game, GamePlayer, RoleBucket } from "@/lib/types";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import { DEFAULT_SECRET_VILLAIN_MODE_CONFIG } from "@/lib/game/modes/secret-villain/lobby-config";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import { WerewolfPhase, WerewolfRole } from "@/lib/game/modes/werewolf";
import { DEFAULT_WEREWOLF_MODE_CONFIG } from "@/lib/game/modes/werewolf/lobby-config";

const DEFAULT_BUCKETS: RoleBucket[] = [
  { playerCount: 1, roles: [{ roleId: "good" }] },
  { playerCount: 1, roles: [{ roleId: "bad" }] },
];

function makePlayer(
  id: string,
  visiblePlayers: GamePlayer["visiblePlayers"] = [],
): GamePlayer {
  return {
    id,
    name: `Player ${id}`,
    sessionId: `session-${id}`,
    visiblePlayers,
  };
}

function makeGameWithPlayers(
  players: GamePlayer[],
  roleAssignments: Game["roleAssignments"],
  showRolesInPlay: ShowRolesInPlay = ShowRolesInPlay.RoleAndCount,
  configuredRoleBuckets: RoleBucket[] = DEFAULT_BUCKETS,
): Game {
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

describe("GameStateService.getPlayerGameState", () => {
  it("returns null when callerId is not in game.players", () => {
    const game = makeGameWithPlayers(
      [makePlayer("p1")],
      [{ playerId: "p1", roleDefinitionId: "good" }],
    );

    expect(getPlayerGameState(game, "unknown")).toBeNull();
  });

  it("returns null when caller has no role assignment", () => {
    const game = makeGameWithPlayers([makePlayer("p1")], []);

    expect(getPlayerGameState(game, "p1")).toBeNull();
  });

  it("returns null when caller's role definition does not exist", () => {
    const game = makeGameWithPlayers(
      [makePlayer("p1")],
      [{ playerId: "p1", roleDefinitionId: "unknown-role" }],
    );

    expect(getPlayerGameState(game, "p1")).toBeNull();
  });

  it("returns correct status, player list, and myRole", () => {
    const game = makeGameWithPlayers(
      [makePlayer("p1"), makePlayer("p2")],
      [
        { playerId: "p1", roleDefinitionId: "good" },
        { playerId: "p2", roleDefinitionId: "bad" },
      ],
    );

    const result = getPlayerGameState(game, "p1");

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

    const result = getPlayerGameState(game, "p1");

    expect(result?.visibleRoleAssignments).toEqual([]);
  });

  it("visibleRoleAssignments lists teammates from caller's visiblePlayers", () => {
    const p2 = makePlayer("p2");
    const p1 = makePlayer("p1", [{ playerId: "p2", reason: "aware-of" }]);
    const game = makeGameWithPlayers(
      [p1, p2],
      [
        { playerId: "p1", roleDefinitionId: "bad" },
        { playerId: "p2", roleDefinitionId: "bad" },
      ],
    );

    const result = getPlayerGameState(game, "p1");

    expect(result?.visibleRoleAssignments).toEqual([
      {
        player: { id: "p2", name: "Player p2" },
        reason: "aware-of",
      },
    ]);
  });
});

// ---------------------------------------------------------------------------
// getPlayerGameState — board player (Secret Villain includeBoard)
// ---------------------------------------------------------------------------

describe("GameStateService.getPlayerGameState — board player", () => {
  it("returns empty visibleRoleAssignments for the board player", () => {
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.SecretVillain,
      status: { type: GameStatus.Playing },
      players: [makePlayer("board"), makePlayer("p1"), makePlayer("p2")],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: "good" },
        { playerId: "p2", roleDefinitionId: "bad" },
      ],
      configuredRoleBuckets: DEFAULT_BUCKETS,
      showRolesInPlay: ShowRolesInPlay.RoleAndCount,
      ownerPlayerId: "board",
      modeConfig: { ...DEFAULT_SECRET_VILLAIN_MODE_CONFIG, includeBoard: true },
      timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    };

    const result = getPlayerGameState(game, "board");

    expect(result?.visibleRoleAssignments).toEqual([]);
  });

  it("returns full visibleRoleAssignments for the owner when includeBoard is false", () => {
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.SecretVillain,
      status: { type: GameStatus.Playing },
      players: [makePlayer("narrator"), makePlayer("p1"), makePlayer("p2")],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: "good" },
        { playerId: "p2", roleDefinitionId: "bad" },
      ],
      configuredRoleBuckets: DEFAULT_BUCKETS,
      showRolesInPlay: ShowRolesInPlay.RoleAndCount,
      ownerPlayerId: "narrator",
      modeConfig: DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
      timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    };

    const result = getPlayerGameState(game, "narrator");

    expect(result?.visibleRoleAssignments).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getPlayerGameState — narrator nominationsEnabled
// ---------------------------------------------------------------------------

function makeNarratorGame(nominationsEnabled = false): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing },
    players: [makePlayer("narrator"), makePlayer("p1"), makePlayer("p2")],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: "werewolf-villager" },
      { playerId: "p2", roleDefinitionId: "werewolf-werewolf" },
    ],
    configuredRoleBuckets: [
      { playerCount: 1, roles: [{ roleId: "werewolf-villager" }] },
      { playerCount: 1, roles: [{ roleId: "werewolf-werewolf" }] },
    ],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "narrator",
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled,
      singleTrialPerDay: true,
      revealProtections: true,
      showRolesOnDeath: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  };
}

function makeWerewolfDeathRevealGame(showRolesOnDeath: boolean): Game {
  return {
    id: "werewolf-game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: {
      type: GameStatus.Playing,
      turnState: {
        turn: 1,
        deadPlayerIds: ["p2"],
        phase: {
          type: WerewolfPhase.Daytime,
          startedAt: 1000,
          nightActions: {},
        },
      },
    },
    players: [makePlayer("narrator"), makePlayer("p1"), makePlayer("p2")],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
    ],
    configuredRoleBuckets: [
      {
        playerCount: 2,
        roles: [
          { roleId: WerewolfRole.Seer },
          { roleId: WerewolfRole.Werewolf },
        ],
      },
    ],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "narrator",
    modeConfig: {
      ...DEFAULT_WEREWOLF_MODE_CONFIG,
      showRolesOnDeath,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  };
}

describe("GameStateService.getPlayerGameState — narrator nominationsEnabled", () => {
  it("narrator state has nominationsEnabled true when enabled on game", () => {
    const game = makeNarratorGame(true);
    const result = getPlayerGameState(
      game,
      "narrator",
    ) as WerewolfPlayerGameState | null;
    expect(result?.nominationsEnabled).toBe(true);
  });

  it("narrator state has nominationsEnabled false when disabled on game", () => {
    const game = makeNarratorGame(false);
    const result = getPlayerGameState(
      game,
      "narrator",
    ) as WerewolfPlayerGameState | null;
    expect(result?.nominationsEnabled).toBe(false);
  });

  it("narrator state has myPlayerId undefined and myRole undefined", () => {
    const game = makeNarratorGame(true);
    const result = getPlayerGameState(game, "narrator");
    expect(result?.myPlayerId).toBeUndefined();
    expect(result?.myRole).toBeUndefined();
  });
});

describe("GameStateService.getPlayerGameState — Werewolf showRolesOnDeath", () => {
  it("reveals killed player roles during play when showRolesOnDeath is enabled", () => {
    const game = makeWerewolfDeathRevealGame(true);

    const result = getPlayerGameState(
      game,
      "p1",
    ) as WerewolfPlayerGameState | null;

    expect(result?.visibleRoleAssignments).toEqual([
      {
        player: { id: "p2", name: "Player p2" },
        reason: "revealed",
        role: {
          id: WerewolfRole.Werewolf,
          name: "Werewolf",
          team: Team.Bad,
        },
      },
    ]);
  });

  it("does not reveal killed player roles during play when showRolesOnDeath is disabled", () => {
    const game = makeWerewolfDeathRevealGame(false);

    const result = getPlayerGameState(game, "p1");

    expect(result?.visibleRoleAssignments).toEqual([]);
  });
});
