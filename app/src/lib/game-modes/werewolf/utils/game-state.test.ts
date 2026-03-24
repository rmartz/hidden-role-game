import { describe, it, expect } from "vitest";
import {
  GameMode,
  GameStatus,
  ShowRolesInPlay,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { isOwnerPlaying, currentTurnState } from "./game-state";

function makePlayingGame(
  turnState: WerewolfTurnState,
  overrides: Partial<Game> = {},
): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [],
    roleAssignments: [],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
    nominationsEnabled: false,
    singleTrialPerDay: true,
    revealProtections: true,
    timerConfig: DEFAULT_TIMER_CONFIG,
    ...overrides,
  };
}

const nightTurnState: WerewolfTurnState = {
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

const dayTurnState: WerewolfTurnState = {
  turn: 1,
  phase: { type: WerewolfPhase.Daytime, startedAt: 1000, nightActions: {} },
  deadPlayerIds: [],
};

describe("isOwnerPlaying", () => {
  it("returns true when caller is owner and game is Playing", () => {
    const game = makePlayingGame(nightTurnState);
    expect(isOwnerPlaying(game, "owner-1")).toBe(true);
  });

  it("returns false when caller is not the owner", () => {
    const game = makePlayingGame(nightTurnState);
    expect(isOwnerPlaying(game, "player-2")).toBe(false);
  });

  it("returns false when game is not in Playing status", () => {
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.Werewolf,
      status: { type: GameStatus.Starting },
      players: [],
      roleAssignments: [],
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: "owner-1",
      nominationsEnabled: false,
      singleTrialPerDay: true,
      revealProtections: true,
      timerConfig: DEFAULT_TIMER_CONFIG,
    };
    expect(isOwnerPlaying(game, "owner-1")).toBe(false);
  });

  it("returns false when ownerPlayerId is undefined", () => {
    const game = makePlayingGame(nightTurnState, { ownerPlayerId: undefined });
    expect(isOwnerPlaying(game, "owner-1")).toBe(false);
  });
});

describe("currentTurnState", () => {
  it("returns turnState when game is Playing", () => {
    const game = makePlayingGame(nightTurnState);
    expect(currentTurnState(game)).toEqual(nightTurnState);
  });

  it("returns undefined when game is not Playing", () => {
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.Werewolf,
      status: { type: GameStatus.Starting },
      players: [],
      roleAssignments: [],
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: "owner-1",
      nominationsEnabled: false,
      singleTrialPerDay: true,
      revealProtections: true,
      timerConfig: DEFAULT_TIMER_CONFIG,
    };
    expect(currentTurnState(game)).toBeUndefined();
  });

  it("returns undefined when turnState is absent", () => {
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.Werewolf,
      status: { type: GameStatus.Playing },
      players: [],
      roleAssignments: [],
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: "owner-1",
      nominationsEnabled: false,
      singleTrialPerDay: true,
      revealProtections: true,
      timerConfig: DEFAULT_TIMER_CONFIG,
    };
    expect(currentTurnState(game)).toBeUndefined();
  });

  it("returns correct turnState for day phase", () => {
    const game = makePlayingGame(dayTurnState);
    expect(currentTurnState(game)).toEqual(dayTurnState);
  });
});
