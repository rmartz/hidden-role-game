import { describe, it, expect } from "vitest";
import { GameMode, GameStatus } from "@/lib/models";
import type { Game } from "@/lib/models";
import { WerewolfPhase, WerewolfRole } from "./roles";
import type { WerewolfTurnState } from "./roles";
import {
  buildNightPhaseOrder,
  isOwnerPlaying,
  currentTurnState,
} from "./utils";

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
    showRolesInPlay: false,
    ownerPlayerId: "owner-1",
    ...overrides,
  };
}

const nightTurnState: WerewolfTurnState = {
  turn: 1,
  phase: {
    type: WerewolfPhase.Nighttime,
    nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
    currentPhaseIndex: 0,
  },
};

const dayTurnState: WerewolfTurnState = {
  turn: 1,
  phase: { type: WerewolfPhase.Daytime, startedAt: 1000 },
};

describe("buildNightPhaseOrder", () => {
  const assignments = [
    { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
    { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
    { playerId: "p3", roleDefinitionId: WerewolfRole.Mason },
    { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
  ];

  it("includes EveryNight and FirstNightOnly roles on turn 1", () => {
    const order = buildNightPhaseOrder(1, assignments);
    expect(order).toContain(WerewolfRole.Werewolf);
    expect(order).toContain(WerewolfRole.Seer);
    expect(order).toContain(WerewolfRole.Mason);
  });

  it("excludes FirstNightOnly roles on turn 2+", () => {
    const order = buildNightPhaseOrder(2, assignments);
    expect(order).toContain(WerewolfRole.Werewolf);
    expect(order).toContain(WerewolfRole.Seer);
    expect(order).not.toContain(WerewolfRole.Mason);
  });

  it("excludes roles not present in roleAssignments", () => {
    const order = buildNightPhaseOrder(1, assignments);
    expect(order).not.toContain(WerewolfRole.Witch);
    expect(order).not.toContain(WerewolfRole.Spellcaster);
  });

  it("excludes Never-waking roles even if assigned", () => {
    const order = buildNightPhaseOrder(1, assignments);
    expect(order).not.toContain(WerewolfRole.Villager);
  });
});

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
      showRolesInPlay: false,
      ownerPlayerId: "owner-1",
    };
    expect(isOwnerPlaying(game, "owner-1")).toBe(false);
  });

  it("returns false when ownerPlayerId is null", () => {
    const game = makePlayingGame(nightTurnState, { ownerPlayerId: null });
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
      showRolesInPlay: false,
      ownerPlayerId: "owner-1",
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
      showRolesInPlay: false,
      ownerPlayerId: "owner-1",
    };
    expect(currentTurnState(game)).toBeUndefined();
  });

  it("returns correct turnState for day phase", () => {
    const game = makePlayingGame(dayTurnState);
    expect(currentTurnState(game)).toEqual(dayTurnState);
  });
});
