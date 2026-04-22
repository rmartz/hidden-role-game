import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState, AnyNightAction } from "../types";
import { WerewolfRole } from "../roles";
import { extractPlayerNightState } from "./player-night-state";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";
import { WEREWOLF_ROLES } from "../roles";

function makeGame(
  turnState: WerewolfTurnState,
  overrides: Partial<Game> = {},
): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "Dave", sessionId: "s4", visiblePlayers: [] },
      { id: "p5", name: "Eve", sessionId: "s5", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.TheThing },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Insomniac },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Count },
      { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
    playerOrder: ["p1", "p2", "p3", "p4", "p5"],
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      trialsPerDay: 1,
      revealProtections: true,
      hiddenRoleCount: 0,
      showRolesOnDeath: true,
      autoRevealNightOutcome: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    ...overrides,
  } as Game;
}

function makeNightState(
  turn: number,
  nightActions: Record<string, AnyNightAction> = {},
  nightPhaseOrder: string[] = [],
): WerewolfTurnState {
  return {
    turn,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder,
      currentPhaseIndex: 0,
      nightActions,
    },
    deadPlayerIds: [],
  };
}

describe("The Thing night state", () => {
  it("provides adjacent player IDs from the player order", () => {
    const ts = makeNightState(2, {}, [WerewolfRole.TheThing]);
    const game = makeGame(ts);
    // p2 (The Thing) is at index 1 in playerOrder ["p1","p2","p3","p4","p5"]
    // left = p1, right = p3
    const state = extractPlayerNightState(
      game,
      "p2",
      WEREWOLF_ROLES[WerewolfRole.TheThing],
      [],
    );
    expect(state.adjacentPlayerIds).toEqual(["p1", "p3"]);
  });

  it("wraps around the seating circle for the first player", () => {
    const ts = makeNightState(2, {}, [WerewolfRole.TheThing]);
    // p1 is at index 0 — left neighbour wraps to p5
    const game = makeGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.TheThing },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    const state = extractPlayerNightState(
      game,
      "p1",
      WEREWOLF_ROLES[WerewolfRole.TheThing],
      [],
    );
    expect(state.adjacentPlayerIds).toContain("p5");
    expect(state.adjacentPlayerIds).toContain("p2");
  });

  it("surfaces confirmed tap target as thingTappedPlayerId", () => {
    const ts = makeNightState(
      2,
      {
        [WerewolfRole.TheThing]: {
          targetPlayerId: "p3",
          confirmed: true,
        },
      },
      [WerewolfRole.TheThing],
    );
    const game = makeGame(ts);
    const state = extractPlayerNightState(
      game,
      "p2",
      WEREWOLF_ROLES[WerewolfRole.TheThing],
      [],
    );
    expect(state.thingTappedPlayerId).toBe("p3");
  });

  it("does not set thingTappedPlayerId when action is unconfirmed", () => {
    const ts = makeNightState(
      2,
      {
        [WerewolfRole.TheThing]: {
          targetPlayerId: "p3",
        },
      },
      [WerewolfRole.TheThing],
    );
    const game = makeGame(ts);
    const state = extractPlayerNightState(
      game,
      "p2",
      WEREWOLF_ROLES[WerewolfRole.TheThing],
      [],
    );
    expect(state.thingTappedPlayerId).toBeUndefined();
  });
});

describe("Insomniac night state", () => {
  it("returns leftActed=false and rightActed=false when neither neighbor acted", () => {
    // p3 is Insomniac at index 2; neighbors are p2 (TheThing) and p4 (Seer)
    const ts = makeNightState(2, {}, [
      WerewolfRole.Werewolf,
      WerewolfRole.Insomniac,
    ]);
    const game = makeGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Insomniac },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    const state = extractPlayerNightState(
      game,
      "p3",
      WEREWOLF_ROLES[WerewolfRole.Insomniac],
      [],
    );
    expect(state.insomniactResult).toEqual({
      leftActed: false,
      rightActed: false,
    });
  });

  it("returns leftActed=true when left neighbor (Seer) submitted a target", () => {
    // p3 is Insomniac; p2 is Seer (left neighbor) who submitted a target
    const ts = makeNightState(
      2,
      {
        [WerewolfRole.Seer]: { targetPlayerId: "p1", confirmed: true },
      },
      [WerewolfRole.Seer, WerewolfRole.Insomniac],
    );
    const game = makeGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Insomniac },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    const state = extractPlayerNightState(
      game,
      "p3",
      WEREWOLF_ROLES[WerewolfRole.Insomniac],
      [],
    );
    expect(state.insomniactResult?.leftActed).toBe(true);
    expect(state.insomniactResult?.rightActed).toBe(false);
  });

  it("returns false when neighbor's role is not in nightPhaseOrder", () => {
    // p2 is Villager (no night role) — should return false even if neighborId exists
    const ts = makeNightState(2, {}, [WerewolfRole.Insomniac]);
    const game = makeGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Insomniac },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    const state = extractPlayerNightState(
      game,
      "p3",
      WEREWOLF_ROLES[WerewolfRole.Insomniac],
      [],
    );
    expect(state.insomniactResult?.leftActed).toBe(false);
  });

  it("returns true for a Werewolf neighbor who cast a team vote", () => {
    // p2 is Werewolf (left of p3) who voted in the team phase
    const ts = makeNightState(
      2,
      {
        [WerewolfRole.Werewolf]: {
          votes: [{ playerId: "p2", targetPlayerId: "p5" }],
          confirmed: true,
        },
      },
      [WerewolfRole.Werewolf, WerewolfRole.Insomniac],
    );
    const game = makeGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Insomniac },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    const state = extractPlayerNightState(
      game,
      "p3",
      WEREWOLF_ROLES[WerewolfRole.Insomniac],
      [],
    );
    expect(state.insomniactResult?.leftActed).toBe(true);
  });
});

describe("The Count night state", () => {
  it("returns countResult with correct werewolf counts split at midpoint", () => {
    // playerOrder: ["p1","p2","p3","p4","p5"]
    // seatOrder (excluding owner): ["p1","p2","p3","p4","p5"]
    // mid = ceil(5/2) = 3 → leftHalf = [p1,p2,p3], rightHalf = [p4,p5]
    // p1 is Werewolf → leftCount=1, rightCount=0
    const ts = makeNightState(1, {}, [WerewolfRole.Count]);
    const game = makeGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Count },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    const state = extractPlayerNightState(
      game,
      "p4",
      WEREWOLF_ROLES[WerewolfRole.Count],
      [],
    );
    expect(state.countResult).toEqual({ leftCount: 1, rightCount: 0 });
  });

  it("returns countResult with werewolf in right half", () => {
    // p5 is Werewolf → leftHalf=[p1,p2,p3] rightHalf=[p4,p5] → rightCount=1
    const ts = makeNightState(1, {}, [WerewolfRole.Count]);
    const game = makeGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Count },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Werewolf },
      ],
    });
    const state = extractPlayerNightState(
      game,
      "p4",
      WEREWOLF_ROLES[WerewolfRole.Count],
      [],
    );
    expect(state.countResult).toEqual({ leftCount: 0, rightCount: 1 });
  });

  it("returns empty result on turn 2+ (Count only acts on night 1)", () => {
    const ts = makeNightState(2, {}, []);
    const game = makeGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Count },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    const state = extractPlayerNightState(
      game,
      "p4",
      WEREWOLF_ROLES[WerewolfRole.Count],
      [],
    );
    expect(state.countResult).toBeUndefined();
  });
});
