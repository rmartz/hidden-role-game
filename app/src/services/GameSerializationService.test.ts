import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game } from "@/lib/types";
import {
  WerewolfPhase,
  WerewolfRole,
  getTeamPhaseKey,
} from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import { GameSerializationService } from "./GameSerializationService";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeDaytimeGame(
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

// ---------------------------------------------------------------------------
// extractDaytimeNightState
// ---------------------------------------------------------------------------

describe("GameSerializationService.extractDaytimeNightState", () => {
  const service = new GameSerializationService();

  it("returns empty when game is not in a daytime phase", () => {
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
            nightPhaseOrder: [WerewolfRole.Seer],
            currentPhaseIndex: 0,
            nightActions: {},
          },
          deadPlayerIds: [],
        } satisfies WerewolfTurnState,
      },
      players: [{ id: "p2", name: "Bob", sessionId: "s2", visibleRoles: [] }],
      roleAssignments: [
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      ],
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: undefined,
    };

    const result = service.extractDaytimeNightState(game);
    expect(result).toEqual({});
  });

  it("nightStatus is absent when no players died or were silenced", () => {
    const game = makeDaytimeGame({
      nightResolution: [
        {
          type: "killed" as const,
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: ["p3"],
          died: false,
        },
      ],
    });

    const result = service.extractDaytimeNightState(game);
    expect(result.nightStatus).toBeUndefined();
  });

  it("nightStatus contains killed entry for each player who died", () => {
    const game = makeDaytimeGame({
      nightResolution: [
        {
          type: "killed" as const,
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
        {
          type: "killed" as const,
          targetPlayerId: "p3",
          attackedBy: ["p1"],
          protectedBy: ["p3"],
          died: false,
        },
      ],
    });

    const result = service.extractDaytimeNightState(game);
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "killed" },
    ]);
  });

  it("nightStatus contains silenced entry for each silenced player", () => {
    const game = makeDaytimeGame({
      nightResolution: [{ type: "silenced", targetPlayerId: "p3" }],
    });

    const result = service.extractDaytimeNightState(game);
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p3", effect: "silenced" },
    ]);
  });

  it("nightStatus omits attackedBy and protectedBy", () => {
    const game = makeDaytimeGame({
      nightResolution: [
        {
          type: "killed" as const,
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
      ],
    });

    const result = service.extractDaytimeNightState(game);
    const entry = result.nightStatus?.[0];
    expect(entry).not.toHaveProperty("attackedBy");
    expect(entry).not.toHaveProperty("protectedBy");
  });
});

// ---------------------------------------------------------------------------
// extractPlayerNightState — Witch
// ---------------------------------------------------------------------------

const witchRole = { id: WerewolfRole.Witch, name: "Witch", team: Team.Good };

function makeNighttimeGame(
  nightActions: Record<string, unknown> = {},
  witchAbilityUsed = false,
): Game {
  const turnState: WerewolfTurnState = {
    turn: 1,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Witch],
      currentPhaseIndex: 0,
      nightActions: nightActions as Record<
        string,
        import("@/lib/game-modes/werewolf").AnyNightAction
      >,
    },
    deadPlayerIds: [],
    ...(witchAbilityUsed ? { witchAbilityUsed: true } : {}),
  };
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "p1", name: "Alice", sessionId: "s1", visibleRoles: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visibleRoles: [] },
      { id: "p3", name: "Witch", sessionId: "s3", visibleRoles: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Witch },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: undefined,
  };
}

describe("GameSerializationService.extractPlayerNightState (Witch)", () => {
  const service = new GameSerializationService();

  it("returns witchAbilityUsed and nightStatus even when Witch has not acted yet", () => {
    const nightActions = {
      [getTeamPhaseKey(Team.Bad)]: { votes: [], suggestedTargetId: "p2" },
    };
    const game = makeNighttimeGame(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p3",
      witchRole,
      [],
    );
    expect(result.witchAbilityUsed).toBe(false);
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "attacked" },
    ]);
    expect(result.myNightTarget).toBeUndefined();
  });

  it("returns myNightTarget when the Witch has chosen a target", () => {
    const nightActions = {
      [getTeamPhaseKey(Team.Bad)]: { votes: [], suggestedTargetId: "p2" },
      [WerewolfRole.Witch]: { targetPlayerId: "p1" },
    };
    const game = makeNighttimeGame(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p3",
      witchRole,
      [],
    );
    expect(result.myNightTarget).toBe("p1");
    expect(result.witchAbilityUsed).toBe(false);
  });

  it("returns no nightStatus when witchAbilityUsed is true", () => {
    const nightActions = {
      [getTeamPhaseKey(Team.Bad)]: { votes: [], suggestedTargetId: "p2" },
    };
    const game = makeNighttimeGame(nightActions, true);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p3",
      witchRole,
      [],
    );
    expect(result.witchAbilityUsed).toBe(true);
    expect(result.nightStatus).toBeUndefined();
  });
});
