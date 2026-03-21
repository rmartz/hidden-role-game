import { describe, it, expect } from "vitest";
import {
  GameMode,
  GameStatus,
  ShowRolesInPlay,
  Team,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfPhase, WerewolfRole } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import { GameSerializationService } from "./GameSerializationService";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mentalistRole = {
  id: WerewolfRole.Mentalist,
  name: "Mentalist",
  team: Team.Good,
};

/**
 * Creates a nighttime game with Mentalist as p1, and configurable role
 * assignments for p2 and p3 (the investigation targets).
 */
function makeMentalistGame(
  p2Role: WerewolfRole,
  p3Role: WerewolfRole,
  nightActions: Record<string, unknown> = {},
): Game {
  const turnState: WerewolfTurnState = {
    turn: 2,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Mentalist],
      currentPhaseIndex: 0,
      nightActions: nightActions as Record<
        string,
        import("@/lib/game-modes/werewolf").AnyNightAction
      >,
    },
    deadPlayerIds: [],
  };
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "Dave", sessionId: "s4", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Mentalist },
      { playerId: "p2", roleDefinitionId: p2Role },
      { playerId: "p3", roleDefinitionId: p3Role },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: undefined,
    nominationsEnabled: false,
    singleTrialPerDay: true,
    timerConfig: DEFAULT_TIMER_CONFIG,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GameSerializationService.extractPlayerNightState (Mentalist)", () => {
  const service = new GameSerializationService();

  it("returns myNightTarget and mySecondNightTarget when both are set", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        secondTargetPlayerId: "p3",
      },
    };
    const game = makeMentalistGame(
      WerewolfRole.Werewolf,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
    expect(result.myNightTarget).toBe("p2");
    expect(result.mySecondNightTarget).toBe("p3");
  });

  it("mySecondNightTarget is absent when only the first target is set", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: { targetPlayerId: "p2" },
    };
    const game = makeMentalistGame(
      WerewolfRole.Werewolf,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
    expect(result.myNightTarget).toBe("p2");
    expect(result.mySecondNightTarget).toBeUndefined();
  });

  it("investigationResult is absent before narrator reveals it", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        secondTargetPlayerId: "p3",
        confirmed: true,
        resultRevealed: false,
      },
    };
    const game = makeMentalistGame(
      WerewolfRole.Werewolf,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
    expect(result.investigationResult).toBeUndefined();
  });

  it("returns 'different teams' when targets are on Good and Bad team", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        secondTargetPlayerId: "p3",
        confirmed: true,
        resultRevealed: true,
      },
    };
    const game = makeMentalistGame(
      WerewolfRole.Werewolf,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
    expect(result.investigationResult?.isWerewolfTeam).toBe(false);
    expect(result.investigationResult?.secondTargetName).toBe("Charlie");
  });

  it("returns 'same team' (isWerewolfTeam: true) when both targets are on the Bad team", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        secondTargetPlayerId: "p3",
        confirmed: true,
        resultRevealed: true,
      },
    };
    const game = makeMentalistGame(
      WerewolfRole.Werewolf,
      WerewolfRole.WolfCub,
      nightActions,
    );
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
    expect(result.investigationResult?.isWerewolfTeam).toBe(true);
    expect(result.investigationResult?.secondTargetName).toBe("Charlie");
  });

  it("returns 'same team' (isWerewolfTeam: true) when both targets are on the Good team", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        secondTargetPlayerId: "p3",
        confirmed: true,
        resultRevealed: true,
      },
    };
    const game = makeMentalistGame(
      WerewolfRole.Seer,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
    expect(result.investigationResult?.isWerewolfTeam).toBe(true);
    expect(result.investigationResult?.secondTargetName).toBe("Charlie");
  });

  it("returns 'different teams' when first target is Neutral (Neutral wins individually)", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        secondTargetPlayerId: "p3",
        confirmed: true,
        resultRevealed: true,
      },
    };
    // p2 = Chupacabra (Neutral), p3 = Villager (Good)
    const game = makeMentalistGame(
      WerewolfRole.Chupacabra,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
    expect(result.investigationResult?.isWerewolfTeam).toBe(false);
  });

  it("returns 'different teams' when second target is Neutral (Neutral wins individually)", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        secondTargetPlayerId: "p3",
        confirmed: true,
        resultRevealed: true,
      },
    };
    // p2 = Villager (Good), p3 = Chupacabra (Neutral)
    const game = makeMentalistGame(
      WerewolfRole.Villager,
      WerewolfRole.Chupacabra,
      nightActions,
    );
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
    expect(result.investigationResult?.isWerewolfTeam).toBe(false);
  });

  it("returns 'different teams' when both targets are Neutral (each wins individually)", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        secondTargetPlayerId: "p3",
        confirmed: true,
        resultRevealed: true,
      },
    };
    // Both p2 and p3 = Chupacabra (Neutral) — would need two Chupacabras
    // We can reuse the same roleDefinitionId; the check is purely on Team enum
    const game = makeMentalistGame(
      WerewolfRole.Chupacabra,
      WerewolfRole.Chupacabra,
      nightActions,
    );
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
    expect(result.investigationResult?.isWerewolfTeam).toBe(false);
  });

  it("includes the second target player name in the investigation result", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        secondTargetPlayerId: "p3",
        confirmed: true,
        resultRevealed: true,
      },
    };
    const game = makeMentalistGame(
      WerewolfRole.Seer,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
    expect(result.investigationResult?.secondTargetName).toBe("Charlie");
  });

  it("falls through to standard isWerewolf result when secondTargetPlayerId is missing (cannot occur in practice — validation blocks confirming with one target)", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        confirmed: true,
        resultRevealed: true,
      },
    };
    const game = makeMentalistGame(
      WerewolfRole.Seer,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
    // No secondTargetPlayerId → dualTargetInvestigate branch skipped;
    // falls through to the standard Seer-style isWerewolf result.
    expect(result.investigationResult).toEqual({
      targetPlayerId: "p2",
      isWerewolfTeam: false, // Seer is not a Werewolf
    });
  });
});
