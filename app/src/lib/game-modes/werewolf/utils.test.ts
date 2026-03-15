import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfPhase } from "./types";
import type { WerewolfTurnState } from "./types";
import { WerewolfRole } from "./roles";
import {
  buildNightPhaseOrder,
  getTargetablePlayers,
  getTeamPhaseKey,
  isOwnerPlaying,
  currentTurnState,
  getConfirmLabel,
  getPhaseLabel,
  targetPlayerIdOf,
  getSoloTarget,
  isPlayersTurn,
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
    const result = getTargetablePlayers(players, "owner", [], "", null, []);
    expect(result.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("excludes dead players", () => {
    const result = getTargetablePlayers(players, "owner", ["p2"], "", null, []);
    expect(result.map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  it("excludes multiple dead players", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      ["p1", "p3"],
      "",
      null,
      [],
    );
    expect(result.map((p) => p.id)).toEqual(["p2"]);
  });

  it("returns all non-owner players when no one is dead", () => {
    const result = getTargetablePlayers(players, "owner", [], "", null, []);
    expect(result).toHaveLength(3);
  });

  it("handles undefined ownerPlayerId", () => {
    const result = getTargetablePlayers(players, undefined, [], "", null, []);
    expect(result).toHaveLength(4);
  });

  it("returns empty array when all non-owner players are dead", () => {
    const result = getTargetablePlayers(
      players,
      "owner",
      ["p1", "p2", "p3"],
      "",
      null,
      [],
    );
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
    expect(order).toContain(getTeamPhaseKey(Team.Bad));
    expect(order).toContain(WerewolfRole.Seer);
    expect(order).toContain(WerewolfRole.Mason);
  });

  it("excludes FirstNightOnly roles on turn 2+", () => {
    const order = buildNightPhaseOrder(2, assignments);
    expect(order).toContain(getTeamPhaseKey(Team.Bad));
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

describe("getPhaseLabel", () => {
  const roles = {
    seer: { name: "Seer" },
    bodyguard: { name: "Bodyguard" },
  };

  it("returns '<team> Team' for team phase keys", () => {
    expect(getPhaseLabel("team:Bad", roles)).toBe("Bad Team");
    expect(getPhaseLabel("team:Good", roles)).toBe("Good Team");
  });

  it("returns the role name for known solo role keys", () => {
    expect(getPhaseLabel("seer", roles)).toBe("Seer");
    expect(getPhaseLabel("bodyguard", roles)).toBe("Bodyguard");
  });

  it("returns the raw key as fallback for unknown solo role keys", () => {
    expect(getPhaseLabel("unknown-role", roles)).toBe("unknown-role");
  });
});

describe("targetPlayerIdOf", () => {
  it("returns targetPlayerId from a NightAction", () => {
    expect(targetPlayerIdOf({ targetPlayerId: "p1" })).toBe("p1");
  });

  it("returns suggestedTargetId from a TeamNightAction when set", () => {
    expect(targetPlayerIdOf({ votes: [], suggestedTargetId: "p2" })).toBe("p2");
  });

  it("returns undefined from a TeamNightAction with no suggestedTargetId", () => {
    expect(targetPlayerIdOf({ votes: [] })).toBeUndefined();
  });
});

describe("getSoloTarget", () => {
  it("returns undefined target and false confirmed when action is undefined", () => {
    expect(getSoloTarget(undefined)).toEqual({
      targetPlayerId: undefined,
      confirmed: false,
    });
  });

  it("returns targetPlayerId and confirmed from a NightAction", () => {
    expect(getSoloTarget({ targetPlayerId: "p1", confirmed: true })).toEqual({
      targetPlayerId: "p1",
      confirmed: true,
    });
  });

  it("defaults confirmed to false when absent in a NightAction", () => {
    expect(getSoloTarget({ targetPlayerId: "p1" })).toEqual({
      targetPlayerId: "p1",
      confirmed: false,
    });
  });

  it("returns suggestedTargetId and confirmed from a TeamNightAction", () => {
    expect(
      getSoloTarget({ votes: [], suggestedTargetId: "p2", confirmed: true }),
    ).toEqual({ targetPlayerId: "p2", confirmed: true });
  });

  it("returns undefined target when TeamNightAction has no suggestedTargetId", () => {
    expect(getSoloTarget({ votes: [] })).toEqual({
      targetPlayerId: undefined,
      confirmed: false,
    });
  });
});

describe("isPlayersTurn", () => {
  it("returns false when myRole is null", () => {
    expect(isPlayersTurn(null, WerewolfRole.Seer)).toBe(false);
  });

  it("returns false when activePhaseKey is undefined", () => {
    expect(
      isPlayersTurn({ id: WerewolfRole.Seer, team: Team.Good }, undefined),
    ).toBe(false);
  });

  it("returns true for a solo phase matching the player's role ID", () => {
    expect(
      isPlayersTurn(
        { id: WerewolfRole.Seer, team: Team.Good },
        WerewolfRole.Seer,
      ),
    ).toBe(true);
  });

  it("returns false for a solo phase that does not match the player's role ID", () => {
    expect(
      isPlayersTurn(
        { id: WerewolfRole.Bodyguard, team: Team.Good },
        WerewolfRole.Seer,
      ),
    ).toBe(false);
  });

  it("returns true for a team phase matching the player's team", () => {
    expect(
      isPlayersTurn(
        { id: WerewolfRole.Werewolf, team: Team.Bad },
        getTeamPhaseKey(Team.Bad),
      ),
    ).toBe(true);
  });

  it("returns false for a team phase that does not match the player's team", () => {
    expect(
      isPlayersTurn(
        { id: WerewolfRole.Seer, team: Team.Good },
        getTeamPhaseKey(Team.Bad),
      ),
    ).toBe(false);
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
