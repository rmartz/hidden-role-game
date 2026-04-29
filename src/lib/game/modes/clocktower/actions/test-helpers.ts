import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { DEFAULT_TIMER_CONFIG } from "@/lib/types";
import { ClocktowerPhase } from "../types";
import type { ClocktowerTurnState, ClocktowerDayPhase } from "../types";
import { ClocktowerRole } from "../roles";

export function makeDayPhase(
  overrides: Partial<ClocktowerDayPhase> = {},
): ClocktowerDayPhase {
  return {
    type: ClocktowerPhase.Day,
    nominations: [],
    nominatedByPlayerIds: [],
    ...overrides,
  };
}

export function makeDayTurnState(
  overrides: Partial<ClocktowerTurnState> = {},
  phaseOverrides: Partial<ClocktowerDayPhase> = {},
): ClocktowerTurnState {
  return {
    turn: 1,
    phase: makeDayPhase(phaseOverrides),
    playerOrder: ["p1", "p2", "p3", "p4", "p5"],
    deadPlayerIds: [],
    ghostVotesUsed: [],
    demonPlayerId: "p1",
    ...overrides,
  };
}

export function makePlayingGame(
  turnState: ClocktowerTurnState,
  overrides: Partial<Game> = {},
): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Clocktower,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "Dave", sessionId: "s4", visiblePlayers: [] },
      { id: "p5", name: "Eve", sessionId: "s5", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: ClocktowerRole.Imp },
      { playerId: "p2", roleDefinitionId: ClocktowerRole.Washerwoman },
      { playerId: "p3", roleDefinitionId: ClocktowerRole.Chef },
      { playerId: "p4", roleDefinitionId: ClocktowerRole.Empath },
      { playerId: "p5", roleDefinitionId: ClocktowerRole.Soldier },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
    modeConfig: { gameMode: GameMode.Clocktower },
    timerConfig: DEFAULT_TIMER_CONFIG,
    ...overrides,
  } as Game;
}
