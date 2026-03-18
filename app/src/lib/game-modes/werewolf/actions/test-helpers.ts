import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
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
      { id: "p1", name: "Alice", sessionId: "s1", visibleRoles: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visibleRoles: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visibleRoles: [] },
      { id: "p4", name: "Dave", sessionId: "s4", visibleRoles: [] },
      { id: "p5", name: "Eve", sessionId: "s5", visibleRoles: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
    nominationsEnabled: false,
    ...overrides,
  };
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
        visibleRoles: [
          { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
        ],
      },
      {
        id: "w2",
        name: "Wolf2",
        sessionId: "sw2",
        visibleRoles: [
          { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
        ],
      },
      { id: "p3", name: "Seer", sessionId: "s3", visibleRoles: [] },
      { id: "p4", name: "Villager", sessionId: "s4", visibleRoles: [] },
    ],
    roleAssignments: [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
    nominationsEnabled: false,
    ...overrides,
  };
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
