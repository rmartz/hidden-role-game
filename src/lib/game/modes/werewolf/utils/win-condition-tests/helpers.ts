import type { Game } from "@/lib/types";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";

import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../../timer-config";
import type { WerewolfTurnState } from "../../types";
import { WerewolfPhase } from "../../types";

export function makeGame(
  roleAssignments: { playerId: string; roleDefinitionId: string }[],
  turnState?: WerewolfTurnState,
): Game {
  return {
    id: "g1",
    lobbyId: "l1",
    gameMode: GameMode.Werewolf,
    status: turnState
      ? { type: GameStatus.Playing, turnState }
      : { type: GameStatus.Playing },
    players: roleAssignments.map((a, i) => ({
      id: a.playerId,
      name: a.playerId,
      sessionId: `s${String(i)}`,
      visiblePlayers: [],
    })),
    roleAssignments,
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner",
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      trialsPerDay: 1,
      revealProtections: true,
      hiddenRoleCount: 0,
      showRolesOnDeath: true,
      autoRevealNightOutcome: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  };
}

export function makeDayTurnState(
  overrides: Partial<WerewolfTurnState> = {},
): WerewolfTurnState {
  return {
    turn: 2,
    phase: { type: WerewolfPhase.Daytime, startedAt: 1000, nightActions: {} },
    deadPlayerIds: [],
    ...overrides,
  };
}
