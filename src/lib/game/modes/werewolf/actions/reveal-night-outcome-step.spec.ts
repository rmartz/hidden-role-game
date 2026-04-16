import { describe, expect, it } from "vitest";
import { GameMode, GameStatus } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import type { WerewolfDaytimePhase, WerewolfTurnState } from "../types";
import { NightOutcomeRevealStep, WerewolfPhase } from "../types";
import { makePlayingGame, dayTurnState } from "./test-helpers";

function makeDaytimeTurnState(
  revealStep: NightOutcomeRevealStep,
  nightResolution: NonNullable<
    Extract<
      WerewolfTurnState["phase"],
      { type: WerewolfPhase.Daytime }
    >["nightResolution"]
  >,
): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      nightOutcomeRevealStep: revealStep,
      nightResolution,
    },
    deadPlayerIds: [],
  };
}

function getDaytimePhase(game: Game): WerewolfDaytimePhase {
  if (game.status.type !== GameStatus.Playing) {
    throw new Error("Expected playing game status");
  }
  const turnState = game.status.turnState as WerewolfTurnState;
  if (turnState.phase.type !== WerewolfPhase.Daytime) {
    throw new Error("Expected daytime phase");
  }
  return turnState.phase;
}

describe("WerewolfAction.RevealNightOutcomeStep", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.RevealNightOutcomeStep];

  it("is invalid when auto reveal is enabled", () => {
    const game = makePlayingGame(dayTurnState);
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("advances from hidden to killed when there are killed outcomes", () => {
    const game = makePlayingGame(
      makeDaytimeTurnState(NightOutcomeRevealStep.Hidden, [
        {
          type: "killed",
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
      ]),
      {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: false,
          trialsPerDay: 2,
          revealProtections: true,
          autoRevealNightOutcome: false,
        },
      },
    );
    action.apply(game, null, "owner-1");
    expect(getDaytimePhase(game).nightOutcomeRevealStep).toBe(
      NightOutcomeRevealStep.Killed,
    );
  });

  it("advances from killed to all", () => {
    const game = makePlayingGame(
      makeDaytimeTurnState(NightOutcomeRevealStep.Killed, [
        { type: "silenced", targetPlayerId: "p3" },
      ]),
      {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: false,
          trialsPerDay: 2,
          revealProtections: true,
          autoRevealNightOutcome: false,
        },
      },
    );
    action.apply(game, null, "owner-1");
    expect(getDaytimePhase(game).nightOutcomeRevealStep).toBe(
      NightOutcomeRevealStep.All,
    );
  });

  it("jumps from hidden to all when only status outcomes exist", () => {
    const game = makePlayingGame(
      makeDaytimeTurnState(NightOutcomeRevealStep.Hidden, [
        { type: "silenced", targetPlayerId: "p3" },
      ]),
      {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: false,
          trialsPerDay: 2,
          revealProtections: true,
          autoRevealNightOutcome: false,
        },
      },
    );
    action.apply(game, null, "owner-1");
    expect(getDaytimePhase(game).nightOutcomeRevealStep).toBe(
      NightOutcomeRevealStep.All,
    );
  });
});
