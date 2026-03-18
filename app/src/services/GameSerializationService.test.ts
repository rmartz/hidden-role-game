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
      { id: "owner", name: "Owner", sessionId: "s0", visiblePlayers: [] },
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Bodyguard },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner",
    timerConfig: DEFAULT_TIMER_CONFIG,
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
      players: [{ id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] }],
      roleAssignments: [
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      ],
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: undefined,
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
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Witch", sessionId: "s3", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Witch },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: undefined,
    timerConfig: DEFAULT_TIMER_CONFIG,
  };
}

describe("GameSerializationService.extractPlayerNightState (Witch)", () => {
  const service = new GameSerializationService();

  it("returns witchAbilityUsed and nightStatus even when Witch has not acted yet", () => {
    const nightActions = {
      [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p2" },
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
      [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p2" },
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
      [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p2" },
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

// ---------------------------------------------------------------------------
// extractPlayerNightState — suffixed group phase key (Wolf Cub bonus attack)
// ---------------------------------------------------------------------------

const BONUS_PHASE_KEY = `${WerewolfRole.Werewolf as string}:2`;

const werewolfRole = {
  id: WerewolfRole.Werewolf,
  name: "Werewolf",
  team: Team.Bad,
};

function makeNighttimeGameWithBonusPhase(
  nightActions: Record<string, unknown> = {},
  currentPhaseIndex = 1,
): Game {
  const turnState: WerewolfTurnState = {
    turn: 2,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf, BONUS_PHASE_KEY],
      currentPhaseIndex,
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
      { id: "w1", name: "Wolf1", sessionId: "sw1", visiblePlayers: [] },
      { id: "w2", name: "Wolf2", sessionId: "sw2", visiblePlayers: [] },
      { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: undefined,
    timerConfig: DEFAULT_TIMER_CONFIG,
  };
}

describe("GameSerializationService.extractPlayerNightState (suffixed group phase)", () => {
  const service = new GameSerializationService();

  it("myNightTargetConfirmed is false for the second phase even when the first phase is confirmed", () => {
    const nightActions = {
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
      [BONUS_PHASE_KEY]: {
        votes: [{ playerId: "w1", targetPlayerId: "p3" }],
        suggestedTargetId: "p3",
      },
    };
    const game = makeNighttimeGameWithBonusPhase(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "w1",
      werewolfRole,
      [],
    );
    expect(result.myNightTargetConfirmed).toBe(false);
  });

  it("previousNightTargetId is set to the first phase's suggestedTargetId in the second phase", () => {
    const nightActions = {
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
      [BONUS_PHASE_KEY]: {
        votes: [],
      },
    };
    const game = makeNighttimeGameWithBonusPhase(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "w1",
      werewolfRole,
      [],
    );
    expect(result.previousNightTargetId).toBe("p3");
  });

  it("previousNightTargetId is set even before any vote has been cast in the second phase", () => {
    // Reproduces the bug: when nightActions has no entry for the bonus phase yet
    // (before any player votes), previousNightTargetId must still be surfaced so
    // the first phase's target is immediately shown as unavailable.
    const nightActions = {
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
      // BONUS_PHASE_KEY intentionally absent — no action created yet
    };
    const game = makeNighttimeGameWithBonusPhase(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "w1",
      werewolfRole,
      [],
    );
    expect(result.previousNightTargetId).toBe("p3");
    expect(result.myNightTarget).toBeUndefined();
    expect(result.myNightTargetConfirmed).toBe(false);
  });

  it("myNightTarget reflects the player's vote in the second phase action, not the first", () => {
    const nightActions = {
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
      // Second phase: w1 has not yet voted (votes empty).
      [BONUS_PHASE_KEY]: {
        votes: [],
      },
    };
    const game = makeNighttimeGameWithBonusPhase(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "w1",
      werewolfRole,
      [],
    );
    // The second-phase action has no vote from w1, so myNightTarget is undefined.
    expect(result.myNightTarget).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractDaytimeNightState — mustVoteGuilty (Village Idiot)
// ---------------------------------------------------------------------------

function makeDaytimeGameWithTrial(callerRoleId: WerewolfRole): Game {
  const activeTrial = {
    defendantId: "p1",
    startedAt: 2000,
    votes: [] as { playerId: string; vote: "guilty" | "innocent" }[],
  };
  const turnState: WerewolfTurnState = {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      activeTrial,
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
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: callerRoleId },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner",
    timerConfig: DEFAULT_TIMER_CONFIG,
  };
}

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
