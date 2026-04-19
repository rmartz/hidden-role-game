import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "../timer-config";
import { SvBoardPreset } from "../types";
import type { SecretVillainTurnState } from "../types";
import { SecretVillainRole } from "../roles";
import { SecretVillainPhase } from "../types";
import { BOARD_PRESETS } from "../utils";
import { secretVillainServices } from "../services";
import {
  SecretVillainWinner,
  SvVictoryConditionKey,
} from "../utils/win-condition";
import { SvTheme, getSvThemeLabels } from "../themes";
import { SECRET_VILLAIN_COPY } from "../copy";

const assignments = [
  { playerId: "p1", roleDefinitionId: SecretVillainRole.Good },
  { playerId: "p2", roleDefinitionId: SecretVillainRole.Good },
  { playerId: "p3", roleDefinitionId: SecretVillainRole.Bad },
  { playerId: "p4", roleDefinitionId: SecretVillainRole.SpecialBad },
  { playerId: "p5", roleDefinitionId: SecretVillainRole.Good },
];

const playerIds = assignments.map((a) => a.playerId);

const baseTurnState: SecretVillainTurnState = {
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

function makeFinishedGame(
  winner: SecretVillainWinner,
  conditionKey: SvVictoryConditionKey,
  theme?: SvTheme,
): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: {
      type: GameStatus.Finished,
      winner,
      victoryConditionKey: conditionKey,
    },
    players: playerIds.map((id) => ({
      id,
      name: `Player ${id}`,
      sessionId: `session-${id}`,
      visiblePlayers: [],
    })),
    roleAssignments: assignments,
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    modeConfig: {
      gameMode: GameMode.SecretVillain,
      ...(theme !== undefined ? { theme } : {}),
    },
  } satisfies Game;
}

describe("secretVillainServices extractPlayerState victoryCondition", () => {
  it("sets Good team and policy label for GoodPolicy condition", () => {
    const game = makeFinishedGame(
      SecretVillainWinner.Good,
      SvVictoryConditionKey.GoodPolicy,
    );
    const result = secretVillainServices.extractPlayerState(
      game,
      "p1",
      undefined,
    );
    const themeLabels = getSvThemeLabels(undefined);
    expect(result["victoryCondition"]).toEqual({
      label: SECRET_VILLAIN_COPY.gameOver.victoryConditions.goodPolicy(
        themeLabels.goodTeam,
      ),
      winner: Team.Good,
    });
  });

  it("sets Bad team and policy label for BadPolicy condition", () => {
    const game = makeFinishedGame(
      SecretVillainWinner.Bad,
      SvVictoryConditionKey.BadPolicy,
    );
    const result = secretVillainServices.extractPlayerState(
      game,
      "p1",
      undefined,
    );
    const themeLabels = getSvThemeLabels(undefined);
    expect(result["victoryCondition"]).toEqual({
      label: SECRET_VILLAIN_COPY.gameOver.victoryConditions.badPolicy(
        themeLabels.badTeam,
      ),
      winner: Team.Bad,
    });
  });

  it("sets Bad team and special-bad-elected label for SpecialBadElected condition", () => {
    const game = makeFinishedGame(
      SecretVillainWinner.Bad,
      SvVictoryConditionKey.SpecialBadElected,
    );
    const result = secretVillainServices.extractPlayerState(
      game,
      "p1",
      undefined,
    );
    const themeLabels = getSvThemeLabels(undefined);
    expect(result["victoryCondition"]).toEqual({
      label: SECRET_VILLAIN_COPY.gameOver.victoryConditions.specialBadElected(
        themeLabels.specialBadRole,
      ),
      winner: Team.Bad,
    });
  });

  it("sets Good team and shoot label for GoodShoot condition", () => {
    const game = makeFinishedGame(
      SecretVillainWinner.Good,
      SvVictoryConditionKey.GoodShoot,
    );
    const result = secretVillainServices.extractPlayerState(
      game,
      "p1",
      undefined,
    );
    const themeLabels = getSvThemeLabels(undefined);
    expect(result["victoryCondition"]).toEqual({
      label: SECRET_VILLAIN_COPY.gameOver.victoryConditions.goodShoot(
        themeLabels.specialBadRole,
      ),
      winner: Team.Good,
    });
  });

  it("sets Bad team and chaos label for Chaos condition", () => {
    const game = makeFinishedGame(
      SecretVillainWinner.Bad,
      SvVictoryConditionKey.Chaos,
    );
    const result = secretVillainServices.extractPlayerState(
      game,
      "p1",
      undefined,
    );
    const themeLabels = getSvThemeLabels(undefined);
    expect(result["victoryCondition"]).toEqual({
      label: SECRET_VILLAIN_COPY.gameOver.victoryConditions.chaos(
        themeLabels.badTeam,
      ),
      winner: Team.Bad,
    });
  });

  it("uses themed labels when svTheme is set", () => {
    const theme = SvTheme.Original;
    const game = makeFinishedGame(
      SecretVillainWinner.Good,
      SvVictoryConditionKey.GoodPolicy,
      theme,
    );
    const result = secretVillainServices.extractPlayerState(
      game,
      "p1",
      undefined,
    );
    const themeLabels = getSvThemeLabels(theme);
    expect(result["victoryCondition"]).toEqual({
      label: SECRET_VILLAIN_COPY.gameOver.victoryConditions.goodPolicy(
        themeLabels.goodTeam,
      ),
      winner: Team.Good,
    });
  });

  it("returns no victoryCondition when game is still playing", () => {
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.SecretVillain,
      status: { type: GameStatus.Playing, turnState: baseTurnState },
      players: playerIds.map((id) => ({
        id,
        name: `Player ${id}`,
        sessionId: `session-${id}`,
        visiblePlayers: [],
      })),
      roleAssignments: assignments,
      configuredRoleBuckets: [],
      showRolesInPlay: ShowRolesInPlay.None,
      timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
      modeConfig: { gameMode: GameMode.SecretVillain },
    } satisfies Game;
    const result = secretVillainServices.extractPlayerState(
      game,
      "p1",
      undefined,
    );
    expect(result["victoryCondition"]).toBeUndefined();
  });

  it("returns no victoryCondition when finished with no conditionKey", () => {
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.SecretVillain,
      status: { type: GameStatus.Finished, winner: SecretVillainWinner.Good },
      players: playerIds.map((id) => ({
        id,
        name: `Player ${id}`,
        sessionId: `session-${id}`,
        visiblePlayers: [],
      })),
      roleAssignments: assignments,
      configuredRoleBuckets: [],
      showRolesInPlay: ShowRolesInPlay.None,
      timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
      modeConfig: { gameMode: GameMode.SecretVillain },
    } satisfies Game;
    const result = secretVillainServices.extractPlayerState(
      game,
      "p1",
      undefined,
    );
    expect(result["victoryCondition"]).toBeUndefined();
  });
});
