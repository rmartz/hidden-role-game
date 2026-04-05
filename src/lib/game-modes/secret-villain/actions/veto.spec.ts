import { describe, it, expect } from "vitest";
import {
  GameMode,
  GameStatus,
  DEFAULT_TIMER_CONFIG,
  ShowRolesInPlay,
} from "@/lib/types";
import type { Game } from "@/lib/types";
import {
  SecretVillainPhase,
  PolicyCard,
  VETO_UNLOCK_THRESHOLD,
  SvBoardPreset,
} from "../types";
import type { SecretVillainTurnState, PolicyChancellorPhase } from "../types";
import { BOARD_PRESETS } from "../utils";
import { SecretVillainRole } from "../roles";
import { proposeVetoAction, respondVetoAction } from "./veto";

function makePlayer(id: string) {
  return {
    id,
    name: `Player ${id}`,
    sessionId: `session-${id}`,
    visiblePlayers: [],
  };
}

function makeChancellorGame(
  overrides: Partial<SecretVillainTurnState> = {},
): Game {
  const baseTurnState: SecretVillainTurnState = {
    presidentOrder: ["p1", "p2", "p3", "p4", "p5"],
    currentPresidentIndex: 0,
    turn: 1,
    phase: {
      type: SecretVillainPhase.PolicyChancellor,
      startedAt: 1000,
      presidentId: "p1",
      chancellorId: "p3",
      remainingCards: [PolicyCard.Good, PolicyCard.Bad],
    },
    goodCardsPlayed: 0,
    badCardsPlayed: 4,
    deck: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good],
    discardPile: [],
    eliminatedPlayerIds: [],
    failedElectionCount: 0,
    boardPreset: SvBoardPreset.Medium,
    powerTable: BOARD_PRESETS[SvBoardPreset.Medium],
    ...overrides,
  };

  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: {
      type: GameStatus.Playing,
      turnState: baseTurnState,
    },
    players: ["p1", "p2", "p3", "p4", "p5"].map(makePlayer),
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p2", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p3", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p4", roleDefinitionId: SecretVillainRole.Bad },
      { playerId: "p5", roleDefinitionId: SecretVillainRole.SpecialBad },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.SecretVillain },
  } satisfies Game;
}

function getTurnState(game: Game): SecretVillainTurnState {
  if (game.status.type !== GameStatus.Playing) throw new Error("Not playing");
  return game.status.turnState as SecretVillainTurnState;
}

// ─── proposeVetoAction ────────────────────────────────────────────────────────

describe("proposeVetoAction", () => {
  describe("isValid", () => {
    it("chancellor can propose veto when 4+ bad cards played", () => {
      const game = makeChancellorGame();
      expect(proposeVetoAction.isValid(game, "p3", {})).toBe(true);
    });

    it("cannot propose when <4 bad cards played", () => {
      const game = makeChancellorGame({
        badCardsPlayed: VETO_UNLOCK_THRESHOLD - 1,
      });
      expect(proposeVetoAction.isValid(game, "p3", {})).toBe(false);
    });

    it("non-chancellor cannot propose", () => {
      const game = makeChancellorGame();
      expect(proposeVetoAction.isValid(game, "p1", {})).toBe(false);
    });

    it("cannot propose twice", () => {
      const game = makeChancellorGame({
        phase: {
          type: SecretVillainPhase.PolicyChancellor,
          startedAt: 1000,
          presidentId: "p1",
          chancellorId: "p3",
          remainingCards: [PolicyCard.Good, PolicyCard.Bad],
          vetoProposed: true,
        },
      });
      expect(proposeVetoAction.isValid(game, "p3", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets vetoProposed to true", () => {
      const game = makeChancellorGame();
      proposeVetoAction.apply(game, {}, "p3");

      const ts = getTurnState(game);
      const phase = ts.phase as PolicyChancellorPhase;
      expect(phase.vetoProposed).toBe(true);
    });
  });
});

// ─── respondVetoAction ────────────────────────────────────────────────────────

describe("respondVetoAction", () => {
  function makeVetoProposedGame(
    overrides: Partial<SecretVillainTurnState> = {},
  ) {
    return makeChancellorGame({
      phase: {
        type: SecretVillainPhase.PolicyChancellor,
        startedAt: 1000,
        presidentId: "p1",
        chancellorId: "p3",
        remainingCards: [PolicyCard.Good, PolicyCard.Bad],
        vetoProposed: true,
      },
      ...overrides,
    });
  }

  describe("isValid", () => {
    it("president can respond with consent boolean", () => {
      const game = makeVetoProposedGame();
      expect(respondVetoAction.isValid(game, "p1", { consent: true })).toBe(
        true,
      );
      expect(respondVetoAction.isValid(game, "p1", { consent: false })).toBe(
        true,
      );
    });

    it("cannot respond before veto is proposed", () => {
      const game = makeChancellorGame();
      expect(respondVetoAction.isValid(game, "p1", { consent: true })).toBe(
        false,
      );
    });

    it("cannot respond twice", () => {
      const game = makeChancellorGame({
        phase: {
          type: SecretVillainPhase.PolicyChancellor,
          startedAt: 1000,
          presidentId: "p1",
          chancellorId: "p3",
          remainingCards: [PolicyCard.Good, PolicyCard.Bad],
          vetoProposed: true,
          vetoResponse: true,
        },
      });
      expect(respondVetoAction.isValid(game, "p1", { consent: true })).toBe(
        false,
      );
    });
  });

  describe("apply", () => {
    it("consent=true: discards cards, increments failedElectionCount, sets previous administration, advances to ElectionNomination", () => {
      const game = makeVetoProposedGame({ failedElectionCount: 0 });
      respondVetoAction.apply(game, { consent: true }, "p1");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(SecretVillainPhase.ElectionNomination);
      expect(ts.failedElectionCount).toBe(1);
      expect(ts.previousPresidentId).toBe("p1");
      expect(ts.previousChancellorId).toBe("p3");
      expect(ts.discardPile).toEqual([PolicyCard.Good, PolicyCard.Bad]);
      expect(ts.turn).toBe(2);
    });

    it("consent=false: sets vetoResponse to false, does NOT change phase", () => {
      const game = makeVetoProposedGame();
      respondVetoAction.apply(game, { consent: false }, "p1");

      const ts = getTurnState(game);
      const phase = ts.phase as PolicyChancellorPhase;
      expect(phase.type).toBe(SecretVillainPhase.PolicyChancellor);
      expect(phase.vetoResponse).toBe(false);
      expect(ts.turn).toBe(1);
    });
  });
});
