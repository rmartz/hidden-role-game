import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import type { AnyNightAction } from "@/lib/game-modes/werewolf";
import {
  WerewolfPhase,
  WerewolfRole,
  DEFAULT_WEREWOLF_TIMER_CONFIG,
} from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import { WEREWOLF_ROLES } from "@/lib/game-modes/werewolf/roles";

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
      nightActions: nightActions as Record<string, AnyNightAction>,
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
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      singleTrialPerDay: true,
      revealProtections: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
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
      nightActions: nightActions as Record<string, AnyNightAction>,
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
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      singleTrialPerDay: true,
      revealProtections: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  };
}

// ---------------------------------------------------------------------------
// Shared role definitions
// ---------------------------------------------------------------------------

export const witchRole = WEREWOLF_ROLES[WerewolfRole.Witch];
export const werewolfRole = WEREWOLF_ROLES[WerewolfRole.Werewolf];
