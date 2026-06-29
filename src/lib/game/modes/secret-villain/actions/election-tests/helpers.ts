import type { Game } from "@/lib/types";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";

import { SecretVillainRole } from "../../roles";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "../../timer-config";
import type { SecretVillainTurnState } from "../../types";
import { PolicyCard, SecretVillainPhase, SvBoardPreset } from "../../types";
import { BOARD_PRESETS } from "../../utils";

function makePlayer(id: string) {
  return {
    id,
    name: `Player ${id}`,
    sessionId: `session-${id}`,
    visiblePlayers: [],
  };
}

export function makeElectionGame(
  overrides: {
    turnState?: Partial<SecretVillainTurnState>;
    status?: Game["status"];
    roleAssignments?: Game["roleAssignments"];
  } = {},
): Game {
  const baseTurnState: SecretVillainTurnState = {
    presidentOrder: ["p1", "p2", "p3", "p4", "p5"],
    currentPresidentIndex: 0,
    turn: 1,
    phase: {
      type: SecretVillainPhase.ElectionNomination,
      startedAt: 1000,
      presidentId: "p1",
    },
    goodCardsPlayed: 0,
    badCardsPlayed: 0,
    deck: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good],
    discardPile: [],
    eliminatedPlayerIds: [],
    failedElectionCount: 0,
    boardPreset: SvBoardPreset.Medium,
    powerTable: BOARD_PRESETS[SvBoardPreset.Medium],
    ...overrides.turnState,
  };

  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: overrides.status ?? {
      type: GameStatus.Playing,
      turnState: baseTurnState,
    },
    players: ["p1", "p2", "p3", "p4", "p5"].map(makePlayer),
    roleAssignments: overrides.roleAssignments ?? [
      { playerId: "p1", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p2", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p3", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p4", roleDefinitionId: SecretVillainRole.Bad },
      { playerId: "p5", roleDefinitionId: SecretVillainRole.SpecialBad },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.SecretVillain },
  } satisfies Game;
}

export function getTurnState(game: Game): SecretVillainTurnState {
  if (game.status.type !== GameStatus.Playing) throw new Error("Not playing");
  return game.status.turnState as SecretVillainTurnState;
}
