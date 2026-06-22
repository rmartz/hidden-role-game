import type { Game } from "@/lib/types";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";

import { SecretVillainRole } from "../roles";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "../timer-config";
import type { SecretVillainTurnState } from "../types";
import { SecretVillainPhase, SvBoardPreset } from "../types";
import { BOARD_PRESETS } from "../utils";

export const assignments = [
  { playerId: "p1", roleDefinitionId: SecretVillainRole.Good },
  { playerId: "p2", roleDefinitionId: SecretVillainRole.Good },
  { playerId: "p3", roleDefinitionId: SecretVillainRole.Bad },
  { playerId: "p4", roleDefinitionId: SecretVillainRole.SpecialBad },
  { playerId: "p5", roleDefinitionId: SecretVillainRole.Good },
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

export const baseTurnState: SecretVillainTurnState = {
  turn: 1,
  phase: {
    type: SecretVillainPhase.ElectionNomination,
    startedAt: 1000,
    presidentId: "p1",
  },
  presidentOrder: playerIds,
  currentPresidentIndex: 1,
  goodCardsPlayed: 0,
  badCardsPlayed: 0,
  deck: [],
  discardPile: [],
  eliminatedPlayerIds: [],
  failedElectionCount: 0,
  boardPreset: SvBoardPreset.Medium,
  powerTable: BOARD_PRESETS[SvBoardPreset.Medium],
};

export function makeGame(turnState: SecretVillainTurnState): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: { type: GameStatus.Playing, turnState },
    players: makePlayers(),
    roleAssignments: assignments,
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.SecretVillain },
  } satisfies Game;
}

export const goodRole = {
  id: SecretVillainRole.Good,
  name: "Good Role",
  team: Team.Good,
};
