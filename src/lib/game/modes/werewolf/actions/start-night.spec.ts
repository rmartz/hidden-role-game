import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState, WerewolfNighttimePhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame, nightTurnState, dayTurnState } from "./test-helpers";

// ---------------------------------------------------------------------------
// StartNight
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartNight", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartNight];

  describe("isValid", () => {
    it("returns true during daytime when called by owner", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "owner-1", null)).toBe(true);
    });

    it("returns false during nighttime", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "owner-1", null)).toBe(false);
    });

    it("returns false when called by non-owner", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "player-2", null)).toBe(false);
    });

    it("returns false when game is not Playing", () => {
      const game: Game = {
        id: "game-1",
        lobbyId: "lobby-1",
        gameMode: GameMode.Werewolf,
        status: { type: GameStatus.Starting },
        players: [],
        roleAssignments: [],
        configuredRoleBuckets: [],
        showRolesInPlay: ShowRolesInPlay.None,
        ownerPlayerId: "owner-1",
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: false,
          singleTrialPerDay: true,
          revealProtections: true,
        },
        timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
      };
      expect(action.isValid(game, "owner-1", null)).toBe(false);
    });
  });

  describe("apply", () => {
    it("transitions to nighttime on the next turn", () => {
      const game = makePlayingGame(dayTurnState);
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.turn).toBe(2);
      expect(ts.phase.type).toBe(WerewolfPhase.Nighttime);
    });

    it("builds nightPhaseOrder with a single Werewolf group phase key", () => {
      const game = makePlayingGame(dayTurnState);
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.nightPhaseOrder).toContain(WerewolfRole.Werewolf);
      expect(phase.nightPhaseOrder).toContain(WerewolfRole.Seer);
      expect(
        phase.nightPhaseOrder.filter(
          (k) => k === (WerewolfRole.Werewolf as string),
        ),
      ).toHaveLength(1);
      expect(phase.currentPhaseIndex).toBe(0);
    });

    it("sets startedAt to a recent timestamp", () => {
      const before = Date.now();
      const game = makePlayingGame(dayTurnState);
      action.apply(game, null, "owner-1");
      const after = Date.now();
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as WerewolfNighttimePhase;
      expect(phase.startedAt).toBeGreaterThanOrEqual(before);
      expect(phase.startedAt).toBeLessThanOrEqual(after);
    });
  });
});

// ---------------------------------------------------------------------------
// StartNight — nominations do not persist across phase transitions
// ---------------------------------------------------------------------------

describe("StartNight — nominations are not carried into the new night phase", () => {
  const startNight = WEREWOLF_ACTIONS[WerewolfAction.StartNight];
  const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("nominations present in daytime are absent after StartNight", () => {
    const dayWithNominations: WerewolfTurnState = {
      turn: 1,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
        nominations: [{ nominatorId: "p2", defendantId: "p3" }],
      },
      deadPlayerIds: [],
    };
    const game = makePlayingGame(dayWithNominations);
    startNight.apply(game, null, "owner-1");

    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.phase.type).toBe(WerewolfPhase.Nighttime);
    // Nighttime phase has no nominations field
    expect(
      (ts.phase as unknown as Record<string, unknown>)["nominations"],
    ).toBeUndefined();
  });

  it("nominations are absent in the daytime phase that follows the night", () => {
    const dayWithNominations: WerewolfTurnState = {
      turn: 1,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
        nominations: [{ nominatorId: "p2", defendantId: "p3" }],
      },
      deadPlayerIds: [],
    };
    const game = makePlayingGame(dayWithNominations);
    startNight.apply(game, null, "owner-1");
    startDay.apply(game, null, "owner-1");

    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.phase.type).toBe(WerewolfPhase.Daytime);
    expect((ts.phase as { nominations?: unknown }).nominations).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// StartNight — Wolf Cub bonus phase appears the turn after death, then is gone
// ---------------------------------------------------------------------------

const WOLF_CUB_BONUS_PHASE_KEY = `${WerewolfRole.Werewolf as string}:2`;

describe("StartNight — Wolf Cub bonus phase lifecycle", () => {
  const startNight = WEREWOLF_ACTIONS[WerewolfAction.StartNight];
  const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];
  const markDead = WEREWOLF_ACTIONS[WerewolfAction.MarkPlayerDead];

  function makeWolfCubGame(): Game {
    return {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.Werewolf,
      status: {
        type: GameStatus.Playing,
        turnState: {
          turn: 1,
          phase: {
            type: WerewolfPhase.Daytime,
            startedAt: 1000,
            nightActions: {},
          },
          deadPlayerIds: [],
        } satisfies WerewolfTurnState,
      },
      // Extra Villager keeps game alive after wolf cub is eliminated
      players: [
        { id: "w1", name: "Wolf1", sessionId: "sw1", visiblePlayers: [] },
        { id: "c1", name: "Cub", sessionId: "sc1", visiblePlayers: [] },
        { id: "p3", name: "Seer", sessionId: "s3", visiblePlayers: [] },
        { id: "p4", name: "Villager", sessionId: "s4", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "c1", roleDefinitionId: WerewolfRole.WolfCub },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ],
      configuredRoleBuckets: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: "owner-1",
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        singleTrialPerDay: true,
        revealProtections: true,
      },
      timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    };
  }

  it("bonus phase appears in nightPhaseOrder the turn after Wolf Cub death", () => {
    const game = makeWolfCubGame();
    markDead.apply(game, { playerId: "c1" }, "owner-1");
    startNight.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    expect(
      phase.nightPhaseOrder.filter((k) =>
        k.startsWith(WerewolfRole.Werewolf as string),
      ),
    ).toHaveLength(2);
    expect(phase.nightPhaseOrder).toContain(WOLF_CUB_BONUS_PHASE_KEY);
  });

  it("bonus phase is NOT present on the subsequent night after it is consumed", () => {
    const game = makeWolfCubGame();
    // Turn 1 day: mark Wolf Cub dead, then transition to night (turn 2).
    markDead.apply(game, { playerId: "c1" }, "owner-1");
    startNight.apply(game, null, "owner-1");
    // Turn 2 night → day: wolfCubDied flag is consumed by StartNight, not carried over.
    startDay.apply(game, null, "owner-1");
    // Turn 3 night: bonus phase should NOT appear.
    startNight.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfNighttimePhase;
    expect(
      phase.nightPhaseOrder.filter((k) =>
        k.startsWith(WerewolfRole.Werewolf as string),
      ),
    ).toHaveLength(1);
    expect(phase.nightPhaseOrder).not.toContain(WOLF_CUB_BONUS_PHASE_KEY);
  });
});

describe("StartNight — Mirrorcaster charge persistence", () => {
  const startNightAction = WEREWOLF_ACTIONS[WerewolfAction.StartNight];

  it("carries mirrorcasterCharged forward to the next night", () => {
    const game = makePlayingGame({
      ...dayTurnState,
      mirrorcasterCharged: true,
    });
    startNightAction.apply(game, null, "owner-1");

    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.mirrorcasterCharged).toBe(true);
  });

  it("does not carry mirrorcasterCharged when it is false/undefined", () => {
    const game = makePlayingGame(dayTurnState);
    startNightAction.apply(game, null, "owner-1");

    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.mirrorcasterCharged).toBeUndefined();
  });

  it("carries morticianAbilityEnded forward to next night", () => {
    const game = makePlayingGame({
      ...dayTurnState,
      morticianAbilityEnded: true,
    });
    startNightAction.apply(game, null, "owner-1");

    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.morticianAbilityEnded).toBe(true);
  });

  it("does not carry morticianAbilityEnded when it is false/undefined", () => {
    const game = makePlayingGame(dayTurnState);
    startNightAction.apply(game, null, "owner-1");

    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.morticianAbilityEnded).toBeUndefined();
  });
});
