import { describe, it, expect } from "vitest";
import {
  GameMode,
  GameStatus,
  ShowRolesInPlay,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfPhase, WerewolfRole } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import { GameSerializationService } from "./GameSerializationService";
import { makeDaytimeGame } from "./GameSerializationService.test-helpers";

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
      players: [{ id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] }],
      roleAssignments: [
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      ],
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: undefined,
      nominationsEnabled: false,
      singleTrialPerDay: true,
      timerConfig: DEFAULT_TIMER_CONFIG,
    };

    const result = service.extractDaytimeNightState(game, "player-1");
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

    const result = service.extractDaytimeNightState(game, "player-1");
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

    const result = service.extractDaytimeNightState(game, "player-1");
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "killed" },
    ]);
  });

  it("nightStatus contains silenced entry for each silenced player", () => {
    const game = makeDaytimeGame({
      nightResolution: [{ type: "silenced", targetPlayerId: "p3" }],
    });

    const result = service.extractDaytimeNightState(game, "player-1");
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

    const result = service.extractDaytimeNightState(game, "player-1");
    const entry = result.nightStatus?.[0];
    expect(entry).not.toHaveProperty("attackedBy");
    expect(entry).not.toHaveProperty("protectedBy");
  });
});
