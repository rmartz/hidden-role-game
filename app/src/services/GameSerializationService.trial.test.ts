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
import { makeDaytimeGameWithTrial } from "./GameSerializationService.test-helpers";

// ---------------------------------------------------------------------------
// extractDaytimeNightState — mustVoteGuilty (Village Idiot)
// ---------------------------------------------------------------------------

describe("GameSerializationService.extractDaytimeNightState — mustVoteGuilty", () => {
  const service = new GameSerializationService();

  it("sets mustVoteGuilty for a Village Idiot caller during an active trial", () => {
    const game = makeDaytimeGameWithTrial(WerewolfRole.VillageIdiot);
    const result = service.extractDaytimeNightState(game, "p2");
    expect(result.activeTrial?.mustVoteGuilty).toBe(true);
  });

  it("does not set mustVoteGuilty for a non-Village-Idiot caller", () => {
    const game = makeDaytimeGameWithTrial(WerewolfRole.Seer);
    const result = service.extractDaytimeNightState(game, "p2");
    expect(result.activeTrial?.mustVoteGuilty).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractDaytimeNightState — playerCount excludes silenced players
// ---------------------------------------------------------------------------

describe("GameSerializationService.extractDaytimeNightState — playerCount excludes silenced", () => {
  const service = new GameSerializationService();

  it("does not count silenced players in playerCount", () => {
    const activeTrial = {
      defendantId: "p1",
      startedAt: 2000,
      phase: "voting" as const,
      votes: [] as { playerId: string; vote: "guilty" | "innocent" }[],
    };
    const turnState: WerewolfTurnState = {
      turn: 1,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
        nightResolution: [{ type: "silenced", targetPlayerId: "p2" }],
        activeTrial,
      },
      deadPlayerIds: [],
    };
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.Werewolf,
      status: { type: GameStatus.Playing, turnState },
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
        { id: "p4", name: "Diana", sessionId: "s4", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ],
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: "owner",
      nominationsEnabled: false,
      singleTrialPerDay: true,
      timerConfig: DEFAULT_TIMER_CONFIG,
    };
    const result = service.extractDaytimeNightState(game, "p3");
    expect(result.activeTrial?.playerCount).toBe(2);
  });

  it("does not double-count when the defendant is also silenced", () => {
    const activeTrial = {
      defendantId: "p1",
      startedAt: 2000,
      phase: "voting" as const,
      votes: [] as { playerId: string; vote: "guilty" | "innocent" }[],
    };
    const turnState: WerewolfTurnState = {
      turn: 1,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
        nightResolution: [{ type: "silenced", targetPlayerId: "p1" }],
        activeTrial,
      },
      deadPlayerIds: [],
    };
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.Werewolf,
      status: { type: GameStatus.Playing, turnState },
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: "owner",
      nominationsEnabled: false,
      singleTrialPerDay: true,
      timerConfig: DEFAULT_TIMER_CONFIG,
    };
    const result = service.extractDaytimeNightState(game, "p2");
    expect(result.activeTrial?.playerCount).toBe(2);
  });
});
