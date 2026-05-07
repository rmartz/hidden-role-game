import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { alphaWolfBiteAction } from "./alpha-wolf-bite";

function makeGame(turnState: WerewolfTurnState) {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "p1", name: "Alpha", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Wolf", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Villager1", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "Villager2", sessionId: "s4", visiblePlayers: [] },
      { id: "p5", name: "Seer", sessionId: "s5", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.AlphaWolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p5", roleDefinitionId: WerewolfRole.Seer },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
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
  };
}

function makeNightTurnState(
  overrides: Partial<WerewolfTurnState> = {},
): WerewolfTurnState {
  return {
    turn: 2,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
      currentPhaseIndex: 0,
      nightActions: {},
    },
    deadPlayerIds: [],
    ...overrides,
  };
}

describe("alphaWolfBiteAction.isValid", () => {
  it("allows narrator to bite a living villager during night", () => {
    const game = makeGame(makeNightTurnState());
    expect(
      alphaWolfBiteAction.isValid(game as never, "owner-1", {
        targetPlayerId: "p3",
      }),
    ).toBe(true);
  });

  it("rejects non-owner caller", () => {
    const game = makeGame(makeNightTurnState());
    expect(
      alphaWolfBiteAction.isValid(game as never, "p1", {
        targetPlayerId: "p3",
      }),
    ).toBe(false);
  });

  it("rejects when not nighttime", () => {
    const game = makeGame({
      turn: 2,
      phase: { type: WerewolfPhase.Daytime, startedAt: 1000, nightActions: {} },
      deadPlayerIds: [],
    });
    expect(
      alphaWolfBiteAction.isValid(game as never, "owner-1", {
        targetPlayerId: "p3",
      }),
    ).toBe(false);
  });

  it("rejects when bite already used", () => {
    const game = makeGame(makeNightTurnState({ alphaWolfBiteUsed: true }));
    expect(
      alphaWolfBiteAction.isValid(game as never, "owner-1", {
        targetPlayerId: "p3",
      }),
    ).toBe(false);
  });

  it("rejects when Alpha Wolf is dead", () => {
    const game = makeGame(makeNightTurnState({ deadPlayerIds: ["p1"] }));
    expect(
      alphaWolfBiteAction.isValid(game as never, "owner-1", {
        targetPlayerId: "p3",
      }),
    ).toBe(false);
  });

  it("rejects biting a dead player", () => {
    const game = makeGame(makeNightTurnState({ deadPlayerIds: ["p3"] }));
    expect(
      alphaWolfBiteAction.isValid(game as never, "owner-1", {
        targetPlayerId: "p3",
      }),
    ).toBe(false);
  });

  it("rejects biting the narrator/owner", () => {
    const game = makeGame(makeNightTurnState());
    expect(
      alphaWolfBiteAction.isValid(game as never, "owner-1", {
        targetPlayerId: "owner-1",
      }),
    ).toBe(false);
  });

  it("rejects biting an existing Werewolf", () => {
    const game = makeGame(makeNightTurnState());
    expect(
      alphaWolfBiteAction.isValid(game as never, "owner-1", {
        targetPlayerId: "p2",
      }),
    ).toBe(false);
  });

  it("rejects biting the Alpha Wolf itself (isWerewolf)", () => {
    const game = makeGame(makeNightTurnState());
    expect(
      alphaWolfBiteAction.isValid(game as never, "owner-1", {
        targetPlayerId: "p1",
      }),
    ).toBe(false);
  });

  it("rejects biting a player already overridden to Werewolf", () => {
    const game = makeGame(
      makeNightTurnState({
        roleOverrides: { p3: WerewolfRole.Werewolf },
      }),
    );
    expect(
      alphaWolfBiteAction.isValid(game as never, "owner-1", {
        targetPlayerId: "p3",
      }),
    ).toBe(false);
  });
});

describe("alphaWolfBiteAction.apply", () => {
  it("sets alphaWolfBiteUsed and adds roleOverride for the target", () => {
    const ts = makeNightTurnState();
    const game = makeGame(ts);
    alphaWolfBiteAction.apply(
      game as never,
      { targetPlayerId: "p3" },
      "owner-1",
    );

    expect(ts.alphaWolfBiteUsed).toBe(true);
    expect(ts.roleOverrides?.["p3"]).toBe(WerewolfRole.Werewolf);
  });

  it("preserves existing roleOverrides when adding a new bite", () => {
    const ts = makeNightTurnState({
      roleOverrides: { p4: WerewolfRole.Werewolf },
    });
    const game = makeGame(ts);
    alphaWolfBiteAction.apply(
      game as never,
      { targetPlayerId: "p3" },
      "owner-1",
    );

    expect(ts.roleOverrides?.["p4"]).toBe(WerewolfRole.Werewolf);
    expect(ts.roleOverrides?.["p3"]).toBe(WerewolfRole.Werewolf);
  });
});
