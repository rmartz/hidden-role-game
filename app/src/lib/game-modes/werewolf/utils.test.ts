import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfPhase } from "./types";
import type { WerewolfTurnState } from "./types";
import { WerewolfRole } from "./roles";
import {
  buildNightPhaseOrder,
  getTargetablePlayers,
  isOwnerPlaying,
  currentTurnState,
  getConfirmLabel,
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
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
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

const players = [
  { id: "owner", name: "Owner" },
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
];

describe("getTargetablePlayers", () => {
  it("excludes the game owner", () => {
    const result = getTargetablePlayers(players, "owner", []);
    expect(result.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("excludes dead players", () => {
    const result = getTargetablePlayers(players, "owner", ["p2"]);
    expect(result.map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  it("excludes multiple dead players", () => {
    const result = getTargetablePlayers(players, "owner", ["p1", "p3"]);
    expect(result.map((p) => p.id)).toEqual(["p2"]);
  });

  it("returns all non-owner players when no one is dead", () => {
    const result = getTargetablePlayers(players, "owner", []);
    expect(result).toHaveLength(3);
  });

  it("handles undefined ownerPlayerId", () => {
    const result = getTargetablePlayers(players, undefined, []);
    expect(result).toHaveLength(4);
  });

  it("returns empty array when all non-owner players are dead", () => {
    const result = getTargetablePlayers(players, "owner", ["p1", "p2", "p3"]);
    expect(result).toHaveLength(0);
  });
});

describe("buildNightPhaseOrder", () => {
  const assignments = [
    { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
    { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
    { playerId: "p3", roleDefinitionId: WerewolfRole.Mason },
    { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
  ];

  it("includes EveryNight and FirstNightOnly roles on turn 1", () => {
    const order = buildNightPhaseOrder(1, assignments);
    expect(order).toContain("team:Bad");
    expect(order).toContain(WerewolfRole.Seer);
    expect(order).toContain(WerewolfRole.Mason);
  });

  it("excludes FirstNightOnly roles on turn 2+", () => {
    const order = buildNightPhaseOrder(2, assignments);
    expect(order).toContain("team:Bad");
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
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
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
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
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
      configuredRoleSlots: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: "owner-1",
    };
    expect(currentTurnState(game)).toBeUndefined();
  });

  it("returns correct turnState for day phase", () => {
    const game = makePlayingGame(dayTurnState);
    expect(currentTurnState(game)).toEqual(dayTurnState);
  });
});

describe("getConfirmLabel", () => {
  it("returns 'Attack' for Werewolf", () => {
    expect(getConfirmLabel(WerewolfRole.Werewolf)).toBe("Attack");
  });

  it("returns 'Attack' for Chupacabra", () => {
    expect(getConfirmLabel(WerewolfRole.Chupacabra)).toBe("Attack");
  });

  it("returns 'Protect' for Bodyguard", () => {
    expect(getConfirmLabel(WerewolfRole.Bodyguard)).toBe("Protect");
  });

  it("returns 'Investigate' for Seer", () => {
    expect(getConfirmLabel(WerewolfRole.Seer)).toBe("Investigate");
  });

  it("returns 'Confirm' for Special roles like Witch", () => {
    expect(getConfirmLabel(WerewolfRole.Witch)).toBe("Confirm");
  });

  it("returns 'Confirm' for None roles like Villager", () => {
    expect(getConfirmLabel(WerewolfRole.Villager)).toBe("Confirm");
  });

  it("returns 'Confirm' for undefined roleId", () => {
    expect(getConfirmLabel(undefined)).toBe("Confirm");
  });

  it("returns 'Confirm' for unknown roleId", () => {
    expect(getConfirmLabel("unknown-role")).toBe("Confirm");
  });
});
