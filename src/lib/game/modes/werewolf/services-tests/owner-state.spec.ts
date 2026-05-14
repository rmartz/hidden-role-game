import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState, NightResolutionEvent } from "../types";
import { WerewolfRole } from "../roles";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";
import { extractDaytimeNightSummary } from "../services/owner-state";

function makeDaytimeGame(
  nightResolution: NightResolutionEvent[],
  overrides: Partial<{
    revealedPlayerIds: string[];
    ownerPlayerId: string;
  }> = {},
): Game {
  const ts: WerewolfTurnState = {
    turn: 2,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      nightResolution,
      revealedPlayerIds: overrides.revealedPlayerIds,
    },
    deadPlayerIds: [],
  };

  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState: ts },
    players: [
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Veteran },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Bodyguard },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: overrides.ownerPlayerId ?? "owner-1",
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      trialsPerDay: 1,
      revealProtections: false,
      hiddenRoleCount: 0,
      showRolesOnDeath: true,
      autoRevealNightOutcome: false,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  };
}

describe("extractDaytimeNightSummary — veteran-counterkill mapping", () => {
  const veteranCounterkilledEvent = {
    type: "veteran-counterkilled" as const,
    counterkilledPlayerId: "p2",
    veteranPlayerId: "p1",
    source: "visitor" as const,
    died: true,
  };

  const wolfRepelEvent = {
    type: "veteran-counterkilled" as const,
    counterkilledPlayerId: "p2",
    veteranPlayerId: "p1",
    source: "wolf-repel" as const,
    died: true,
  };

  it("narrator sees veteran-counterkill event with correct fields", () => {
    const game = makeDaytimeGame([veteranCounterkilledEvent]);

    const result = extractDaytimeNightSummary(game, "owner-1");

    const entry = result.nightStatus?.find(
      (e) => e.effect === "veteran-counterkill",
    );
    expect(entry).toMatchObject({
      targetPlayerId: "p2",
      effect: "veteran-counterkill",
      veteranPlayerId: "p1",
      veteranCounterkillSource: "visitor",
    });
  });

  it("narrator sees wolf-repel source correctly", () => {
    const game = makeDaytimeGame([wolfRepelEvent]);

    const result = extractDaytimeNightSummary(game, "owner-1");

    const entry = result.nightStatus?.find(
      (e) => e.effect === "veteran-counterkill",
    );
    expect(entry).toMatchObject({
      veteranCounterkillSource: "wolf-repel",
    });
  });

  it("player sees veteran-counterkill when outcome is revealed", () => {
    const game = makeDaytimeGame([veteranCounterkilledEvent], {
      revealedPlayerIds: ["p2"],
    });

    const result = extractDaytimeNightSummary(game, "p3");

    const entry = result.nightStatus?.find(
      (e) => e.effect === "veteran-counterkill",
    );
    expect(entry).toBeDefined();
    expect(entry?.targetPlayerId).toBe("p2");
  });

  it("player does not see veteran-counterkill before outcome is revealed", () => {
    const game = makeDaytimeGame([veteranCounterkilledEvent]);

    const result = extractDaytimeNightSummary(game, "p3");

    const entry = result.nightStatus?.find(
      (e) => e.effect === "veteran-counterkill",
    );
    expect(entry).toBeUndefined();
  });

  it("veteran-counterkill with died: false is not emitted", () => {
    const absorbedEvent = {
      type: "veteran-counterkilled" as const,
      counterkilledPlayerId: "p2",
      veteranPlayerId: "p1",
      source: "visitor" as const,
      died: false,
    };
    const game = makeDaytimeGame([absorbedEvent]);

    const result = extractDaytimeNightSummary(game, "owner-1");

    const entry = result.nightStatus?.find(
      (e) => e.effect === "veteran-counterkill",
    );
    expect(entry).toBeUndefined();
  });
});
