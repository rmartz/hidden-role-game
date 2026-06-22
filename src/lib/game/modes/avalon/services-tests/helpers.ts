import type { Game } from "@/lib/types";
import {
  DEFAULT_TIMER_CONFIG,
  GameMode,
  GameStatus,
  ShowRolesInPlay,
} from "@/lib/types";

import { AvalonRole } from "../roles";
import type { AvalonTurnState } from "../types";
import { AvalonPhase } from "../types";

export const assignments = [
  { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
  { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
  { playerId: "p3", roleDefinitionId: AvalonRole.LoyalServant },
  { playerId: "p4", roleDefinitionId: AvalonRole.MinionOfMordred },
  { playerId: "p5", roleDefinitionId: AvalonRole.Assassin },
];

export const playerIds = assignments.map((a) => a.playerId);

function makePlayers() {
  return playerIds.map((id) => ({
    id,
    name: `Player ${id}`,
    sessionId: `session-${id}`,
    visiblePlayers: [],
  }));
}

export const baseTurnState: AvalonTurnState = {
  questNumber: 1,
  phase: {
    type: AvalonPhase.TeamProposal,
    leaderId: "p1",
    teamSize: 2,
  },
  leaderOrder: playerIds,
  currentLeaderIndex: 0,
  questResults: [],
  consecutiveRejections: 0,
  questTeamSizes: [2, 3, 2, 3, 3],
  requiresTwoFails: [],
};

export function makeGame(turnState: AvalonTurnState): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Avalon,
    status: { type: GameStatus.Playing, turnState },
    players: makePlayers(),
    roleAssignments: assignments,
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.Avalon },
  } satisfies Game;
}

export const merlinRole = {
  id: AvalonRole.Merlin,
  name: "Merlin",
  team: "Good",
};
export const assassinRole = {
  id: AvalonRole.Assassin,
  name: "Assassin",
  team: "Bad",
};
