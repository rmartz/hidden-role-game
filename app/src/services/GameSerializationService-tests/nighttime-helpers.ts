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

// ---------------------------------------------------------------------------
// makeNighttimeGame (Witch tests)
// ---------------------------------------------------------------------------

export function makeNighttimeGame(
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
    nominationsEnabled: false,
    singleTrialPerDay: true,
    timerConfig: DEFAULT_TIMER_CONFIG,
  };
}

// ---------------------------------------------------------------------------
// makeNighttimeGameWithBonusPhase (suffixed group phase)
// ---------------------------------------------------------------------------

export const BONUS_PHASE_KEY = `${WerewolfRole.Werewolf as string}:2`;

export function makeNighttimeGameWithBonusPhase(
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
    nominationsEnabled: false,
    singleTrialPerDay: true,
    timerConfig: DEFAULT_TIMER_CONFIG,
  };
}

// ---------------------------------------------------------------------------
// Shared role definitions
// ---------------------------------------------------------------------------

export const witchRole = {
  id: WerewolfRole.Witch,
  name: "Witch",
  team: Team.Good,
};

export const werewolfRole = {
  id: WerewolfRole.Werewolf,
  name: "Werewolf",
  team: Team.Bad,
};
