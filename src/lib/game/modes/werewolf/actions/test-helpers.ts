import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState, AnyNightAction } from "../types";
import { WerewolfRole } from "../roles";

export function makePlayingGame(
  turnState: WerewolfTurnState,
  overrides: Partial<Game> = {},
): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    // 5 players: 1 Werewolf + 4 Good — keeps game alive after a single kill
    players: [
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "Dave", sessionId: "s4", visiblePlayers: [] },
      { id: "p5", name: "Eve", sessionId: "s5", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      singleTrialPerDay: true,
      revealProtections: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    ...overrides,
  } as Game;
}

export function makeNightState(
  overrides: Partial<{
    turn: number;
    nightActions: Record<string, AnyNightAction>;
    deadPlayerIds: string[];
    currentPhaseIndex: number;
    nightPhaseOrder: string[];
  }> = {},
): WerewolfTurnState {
  return {
    turn: overrides.turn ?? 1,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: overrides.nightPhaseOrder ?? [
        WerewolfRole.Werewolf,
        WerewolfRole.Seer,
      ],
      currentPhaseIndex: overrides.currentPhaseIndex ?? 0,
      nightActions: overrides.nightActions ?? {},
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
  };
}

export const nightTurnState: WerewolfTurnState = {
  turn: 1,
  phase: {
    type: WerewolfPhase.Nighttime,
    startedAt: 1000,
    nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
    currentPhaseIndex: 0,
    nightActions: {},
  },
  deadPlayerIds: [],
};

export const nightTurn2State: WerewolfTurnState = {
  turn: 2,
  phase: {
    type: WerewolfPhase.Nighttime,
    startedAt: 1000,
    nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
    currentPhaseIndex: 0,
    nightActions: {},
  },
  deadPlayerIds: [],
};

export const dayTurnState: WerewolfTurnState = {
  turn: 1,
  phase: {
    type: WerewolfPhase.Daytime,
    startedAt: 1000,
    nightActions: {},
  },
  deadPlayerIds: [],
};

export const TEAM_BAD_KEY = WerewolfRole.Werewolf;

export function makeTeamGame(
  turnState: WerewolfTurnState,
  overrides: Partial<Game> = {},
): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      {
        id: "w1",
        name: "Wolf1",
        sessionId: "sw1",
        visiblePlayers: [{ playerId: "w2", reason: "wake-partner" as const }],
      },
      {
        id: "w2",
        name: "Wolf2",
        sessionId: "sw2",
        visiblePlayers: [{ playerId: "w1", reason: "wake-partner" as const }],
      },
      { id: "p3", name: "Seer", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "Villager", sessionId: "s4", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      singleTrialPerDay: true,
      revealProtections: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    ...overrides,
  } as Game;
}

export function makeTeamNightState(
  overrides: Partial<{
    turn: number;
    nightActions: Record<string, AnyNightAction>;
    deadPlayerIds: string[];
    currentPhaseIndex: number;
  }> = {},
): WerewolfTurnState {
  return {
    turn: overrides.turn ?? 2,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [TEAM_BAD_KEY, WerewolfRole.Seer],
      currentPhaseIndex: overrides.currentPhaseIndex ?? 0,
      nightActions: overrides.nightActions ?? {},
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
  };
}
