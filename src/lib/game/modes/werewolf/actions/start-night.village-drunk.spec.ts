import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { startNightAction } from "./start-night";

function makeDayTurnState(
  turn: number,
  overrides: Partial<WerewolfTurnState> = {},
): WerewolfTurnState {
  return {
    turn,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
    },
    deadPlayerIds: [],
    ...overrides,
  };
}

function makeGame(
  turnState: WerewolfTurnState,
  villageDrunkSoberRoleId?: string,
): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "p1", name: "AlphaWolf", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Drunk", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "Seer", sessionId: "s4", visiblePlayers: [] },
      { id: "p5", name: "Villager2", sessionId: "s5", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.VillageDrunk },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
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
      ...(villageDrunkSoberRoleId ? { villageDrunkSoberRoleId } : {}),
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  };
}

function getTurnState(game: Game): WerewolfTurnState {
  return (game.status as { turnState: WerewolfTurnState }).turnState;
}

describe("startNightAction — Village Drunk sober transition", () => {
  it("does not apply sober override before turn 3", () => {
    const game = makeGame(makeDayTurnState(1), WerewolfRole.Seer);
    startNightAction.apply(game, undefined, "owner-1");
    const ts = getTurnState(game);
    expect(ts.roleOverrides).toBeUndefined();
    expect(ts.turn).toBe(2);
  });

  it("does not apply sober override on turn 3 when no sober role is configured", () => {
    const game = makeGame(makeDayTurnState(2));
    startNightAction.apply(game, undefined, "owner-1");
    const ts = getTurnState(game);
    expect(ts.roleOverrides).toBeUndefined();
    expect(ts.turn).toBe(3);
  });

  it("applies sober role override at turn 3 when configured", () => {
    const game = makeGame(makeDayTurnState(2), WerewolfRole.Seer);
    startNightAction.apply(game, undefined, "owner-1");
    const ts = getTurnState(game);
    expect(ts.turn).toBe(3);
    expect(ts.roleOverrides?.["p2"]).toBe(WerewolfRole.Seer);
  });

  it("does not apply sober override if Village Drunk is already dead", () => {
    const game = makeGame(
      makeDayTurnState(2, { deadPlayerIds: ["p2"] }),
      WerewolfRole.Seer,
    );
    startNightAction.apply(game, undefined, "owner-1");
    const ts = getTurnState(game);
    expect(ts.roleOverrides?.["p2"]).toBeUndefined();
  });

  it("includes sober role's night phase in nightPhaseOrder when it wakes at night", () => {
    // Seer wakes every night (AfterFirstNight / EveryNight)
    const game = makeGame(makeDayTurnState(2), WerewolfRole.Seer);
    startNightAction.apply(game, undefined, "owner-1");
    const ts = getTurnState(game);
    expect(ts.turn).toBe(3);
    // p2 now has Seer role — Seer should appear in night phase order
    expect(ts.phase.type).toBe(WerewolfPhase.Nighttime);
    if (ts.phase.type === WerewolfPhase.Nighttime) {
      expect(ts.phase.nightPhaseOrder).toContain(WerewolfRole.Seer);
    }
  });

  it("preserves existing roleOverrides when applying sober transition", () => {
    const existingOverrides = { p3: WerewolfRole.Werewolf };
    const game = makeGame(
      makeDayTurnState(2, { roleOverrides: existingOverrides }),
      WerewolfRole.Bodyguard,
    );
    startNightAction.apply(game, undefined, "owner-1");
    const ts = getTurnState(game);
    expect(ts.roleOverrides?.["p3"]).toBe(WerewolfRole.Werewolf);
    expect(ts.roleOverrides?.["p2"]).toBe(WerewolfRole.Bodyguard);
  });

  it("carries forward alphaWolfBiteUsed to the next night", () => {
    const game = makeGame(makeDayTurnState(2, { alphaWolfBiteUsed: true }));
    startNightAction.apply(game, undefined, "owner-1");
    const ts = getTurnState(game);
    expect(ts.alphaWolfBiteUsed).toBe(true);
  });

  it("carries forward roleOverrides unchanged for turns that are not turn 3", () => {
    const existingOverrides = { p3: WerewolfRole.Werewolf };
    const game = makeGame(
      makeDayTurnState(3, { roleOverrides: existingOverrides }),
    );
    startNightAction.apply(game, undefined, "owner-1");
    const ts = getTurnState(game);
    expect(ts.roleOverrides?.["p3"]).toBe(WerewolfRole.Werewolf);
    expect(ts.turn).toBe(4);
  });
});
