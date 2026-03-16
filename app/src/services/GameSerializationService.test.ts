import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game } from "@/lib/types";
import {
  WerewolfPhase,
  WerewolfRole,
  TargetCategory,
  getTeamPhaseKey,
} from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import { GameSerializationService } from "./GameSerializationService";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const werewolfRole = {
  id: WerewolfRole.Werewolf,
  name: "Werewolf",
  team: Team.Bad,
};
const seerRole = { id: WerewolfRole.Seer, name: "Seer", team: Team.Good };
const bodyguardRole = {
  id: WerewolfRole.Bodyguard,
  name: "Bodyguard",
  team: Team.Good,
};

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

    const result = service.extractDaytimeNightState(game, "p2", seerRole);
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

    const result = service.extractDaytimeNightState(game, "p1", werewolfRole);
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

    const result = service.extractDaytimeNightState(game, "p1", werewolfRole);
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "killed" },
    ]);
  });

  it("nightStatus contains silenced entry for each silenced player", () => {
    const game = makeDaytimeGame({
      nightResolution: [{ type: "silenced", targetPlayerId: "p3" }],
    });

    const result = service.extractDaytimeNightState(game, "p1", werewolfRole);
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

    const result = service.extractDaytimeNightState(game, "p1", werewolfRole);
    const entry = result.nightStatus?.[0];
    expect(entry).not.toHaveProperty("attackedBy");
    expect(entry).not.toHaveProperty("protectedBy");
  });
});

// ---------------------------------------------------------------------------
// extractMyLastNightTarget
// ---------------------------------------------------------------------------

describe("GameSerializationService.extractMyLastNightTarget", () => {
  const service = new GameSerializationService();

  it("returns undefined when the player took no action", () => {
    const game = makeDaytimeGame({ nightActions: {} });

    const result = service.extractMyLastNightTarget({}, game, "p2", seerRole);
    expect(result).toBeUndefined();
  });

  it("returns Attack category for a Werewolf team vote", () => {
    const nightActions = {
      [getTeamPhaseKey(Team.Bad)]: {
        votes: [{ playerId: "p1", targetPlayerId: "p3" }],
        confirmed: true,
      },
    };
    const game = makeDaytimeGame({ nightActions });

    const result = service.extractMyLastNightTarget(
      nightActions,
      game,
      "p1",
      werewolfRole,
    );
    expect(result).toEqual({
      targetPlayerId: "p3",
      category: TargetCategory.Attack,
    });
  });

  it("returns Investigate category for the Seer's action", () => {
    const nightActions = {
      [WerewolfRole.Seer]: { targetPlayerId: "p1", confirmed: true },
    };
    const game = makeDaytimeGame({ nightActions });

    const result = service.extractMyLastNightTarget(
      nightActions,
      game,
      "p2",
      seerRole,
    );
    expect(result).toEqual({
      targetPlayerId: "p1",
      category: TargetCategory.Investigate,
    });
  });

  it("returns Protect category for the Bodyguard's action", () => {
    const nightActions = {
      [WerewolfRole.Bodyguard]: { targetPlayerId: "p1", confirmed: true },
    };
    const game = makeDaytimeGame({ nightActions });

    const result = service.extractMyLastNightTarget(
      nightActions,
      game,
      "p3",
      bodyguardRole,
    );
    expect(result).toEqual({
      targetPlayerId: "p1",
      category: TargetCategory.Protect,
    });
  });

  it("returns undefined when the Werewolf's team phase action is missing", () => {
    const game = makeDaytimeGame({ nightActions: {} });

    const result = service.extractMyLastNightTarget(
      {},
      game,
      "p1",
      werewolfRole,
    );
    expect(result).toBeUndefined();
  });

  it("returns undefined when the Werewolf voted but there is no matching vote entry", () => {
    const nightActions = {
      [getTeamPhaseKey(Team.Bad)]: {
        votes: [{ playerId: "p99", targetPlayerId: "p3" }],
        confirmed: false,
      },
    };
    const game = makeDaytimeGame({ nightActions });

    const result = service.extractMyLastNightTarget(
      nightActions,
      game,
      "p1",
      werewolfRole,
    );
    expect(result).toBeUndefined();
  });
});
