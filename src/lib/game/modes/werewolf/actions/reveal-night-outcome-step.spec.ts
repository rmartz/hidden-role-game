import { describe, expect, it } from "vitest";
import { GameMode, GameStatus } from "@/lib/types";
import type { Game, WerewolfGame } from "@/lib/types";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import type { WerewolfDaytimePhase, WerewolfTurnState } from "../types";
import { WerewolfPhase } from "../types";
import { makePlayingGame, dayTurnState } from "./test-helpers";

function makeDaytimeTurnState(
  nightResolution: NonNullable<WerewolfDaytimePhase["nightResolution"]>,
  revealedPlayerIds: string[] = [],
): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      nightResolution,
      ...(revealedPlayerIds.length > 0 ? { revealedPlayerIds } : {}),
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

const manualRevealConfig: Partial<WerewolfGame> = {
  modeConfig: {
    gameMode: GameMode.Werewolf,
    nominationsEnabled: false,
    trialsPerDay: 2,
    revealProtections: true,
    showRolesOnDeath: true,
    hiddenRoleCount: 0,
    autoRevealNightOutcome: false,
  },
};

describe("WerewolfAction.RevealNightOutcomeStep", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.RevealNightOutcomeStep];

  it("is invalid when auto reveal is enabled", () => {
    const game = makePlayingGame(dayTurnState);
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("is invalid when there are no affected players", () => {
    const game = makePlayingGame(
      makeDaytimeTurnState([
        {
          type: "killed",
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: ["p3"],
          died: false,
        },
      ]),
      manualRevealConfig,
    );
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("is invalid when all affected players are already revealed", () => {
    const game = makePlayingGame(
      makeDaytimeTurnState(
        [
          {
            type: "killed",
            targetPlayerId: "p2",
            attackedBy: ["p1"],
            protectedBy: [],
            died: true,
          },
        ],
        ["p2"],
      ),
      manualRevealConfig,
    );
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("reveals the first affected player on first press", () => {
    const game = makePlayingGame(
      makeDaytimeTurnState([
        {
          type: "killed",
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
        { type: "silenced", targetPlayerId: "p3" },
      ]),
      manualRevealConfig,
    );
    action.apply(game, null, "owner-1");
    expect(getDaytimePhase(game).revealedPlayerIds).toEqual(["p2"]);
  });

  it("reveals the next affected player on subsequent press", () => {
    const game = makePlayingGame(
      makeDaytimeTurnState(
        [
          {
            type: "killed",
            targetPlayerId: "p2",
            attackedBy: ["p1"],
            protectedBy: [],
            died: true,
          },
          { type: "silenced", targetPlayerId: "p3" },
        ],
        ["p2"],
      ),
      manualRevealConfig,
    );
    action.apply(game, null, "owner-1");
    expect(getDaytimePhase(game).revealedPlayerIds).toEqual(["p2", "p3"]);
  });

  it("reveals status-only outcome on first press when no kills occurred", () => {
    const game = makePlayingGame(
      makeDaytimeTurnState([{ type: "silenced", targetPlayerId: "p3" }]),
      manualRevealConfig,
    );
    action.apply(game, null, "owner-1");
    expect(getDaytimePhase(game).revealedPlayerIds).toEqual(["p3"]);
  });

  it("is valid after partial reveal when more players remain", () => {
    const game = makePlayingGame(
      makeDaytimeTurnState(
        [
          {
            type: "killed",
            targetPlayerId: "p2",
            attackedBy: ["p1"],
            protectedBy: [],
            died: true,
          },
          { type: "silenced", targetPlayerId: "p3" },
        ],
        ["p2"],
      ),
      manualRevealConfig,
    );
    expect(action.isValid(game, "owner-1", null)).toBe(true);
  });
});
