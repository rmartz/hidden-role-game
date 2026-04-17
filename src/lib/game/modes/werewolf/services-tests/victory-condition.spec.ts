import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game } from "@/lib/types";
import {
  WerewolfRole,
  DEFAULT_WEREWOLF_TIMER_CONFIG,
} from "@/lib/game/modes/werewolf";
import { WerewolfWinner } from "@/lib/game/modes/werewolf/utils/win-condition";
import { werewolfServices } from "../services";
import { WEREWOLF_COPY } from "../copy";

function makeFinishedGame(winner: WerewolfWinner): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Finished, winner },
    players: [
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
    ],
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
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  };
}

describe("werewolfServices extractPlayerState victoryCondition", () => {
  it("sets victoryCondition label and Good team for Village win", () => {
    const game = makeFinishedGame(WerewolfWinner.Village);
    const state = werewolfServices.extractPlayerState(game, "p1", {
      id: WerewolfRole.Seer,
      name: "Seer",
      team: Team.Good,
    });
    expect(state["victoryCondition"]).toEqual({
      label: WEREWOLF_COPY.gameOver.victoryConditions[WerewolfWinner.Village],
      winner: Team.Good,
    });
  });

  it("sets victoryCondition label and Bad team for Werewolves win", () => {
    const game = makeFinishedGame(WerewolfWinner.Werewolves);
    const state = werewolfServices.extractPlayerState(game, "p1", {
      id: WerewolfRole.Seer,
      name: "Seer",
      team: Team.Good,
    });
    expect(state["victoryCondition"]).toEqual({
      label:
        WEREWOLF_COPY.gameOver.victoryConditions[WerewolfWinner.Werewolves],
      winner: Team.Bad,
    });
  });

  it("sets victoryCondition label and Neutral team for Tanner win", () => {
    const game = makeFinishedGame(WerewolfWinner.Tanner);
    const state = werewolfServices.extractPlayerState(game, "p1", {
      id: WerewolfRole.Seer,
      name: "Seer",
      team: Team.Good,
    });
    expect(state["victoryCondition"]).toEqual({
      label: WEREWOLF_COPY.gameOver.victoryConditions[WerewolfWinner.Tanner],
      winner: Team.Neutral,
    });
  });

  it("sets victoryCondition label and Neutral team for LoneWolf win", () => {
    const game = makeFinishedGame(WerewolfWinner.LoneWolf);
    const state = werewolfServices.extractPlayerState(game, "p1", {
      id: WerewolfRole.Seer,
      name: "Seer",
      team: Team.Good,
    });
    expect(state["victoryCondition"]).toEqual({
      label: WEREWOLF_COPY.gameOver.victoryConditions[WerewolfWinner.LoneWolf],
      winner: Team.Neutral,
    });
  });

  it("does not set victoryCondition when game is not finished", () => {
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.Werewolf,
      status: { type: GameStatus.Playing },
      players: [
        { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Seer },
      ],
      configuredRoleBuckets: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: "owner",
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        trialsPerDay: 0,
        revealProtections: true,
        hiddenRoleCount: 0,
        showRolesOnDeath: true,
      },
      timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    };
    const state = werewolfServices.extractPlayerState(game, "p1", {
      id: WerewolfRole.Seer,
      name: "Seer",
      team: Team.Good,
    });
    expect(state["victoryCondition"]).toBeUndefined();
  });
});
