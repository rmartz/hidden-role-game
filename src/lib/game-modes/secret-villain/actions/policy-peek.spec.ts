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
  SpecialActionType,
  PolicyCard,
  SvBoardPreset,
} from "../types";
import type { SecretVillainTurnState, SpecialActionPhase } from "../types";
import { BOARD_PRESETS } from "../utils";
import { SecretVillainRole } from "../roles";
import { policyPeekAction, resolvePolicyPeekAction } from "./policy-peek";

function makePlayer(id: string) {
  return {
    id,
    name: `Player ${id}`,
    sessionId: `session-${id}`,
    visiblePlayers: [],
  };
}

function makeSpecialActionGame(
  actionType: SpecialActionType,
  overrides: Partial<SecretVillainTurnState> = {},
): Game {
  const baseTurnState: SecretVillainTurnState = {
    presidentOrder: ["p1", "p2", "p3", "p4", "p5"],
    currentPresidentIndex: 0,
    turn: 1,
    phase: {
      type: SecretVillainPhase.SpecialAction,
      startedAt: 1000,
      presidentId: "p1",
      actionType,
    },
    goodCardsPlayed: 0,
    badCardsPlayed: 0,
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

// ─── policyPeekAction ─────────────────────────────────────────────────────────

describe("policyPeekAction", () => {
  describe("isValid", () => {
    it("president can peek during PolicyPeek phase", () => {
      const game = makeSpecialActionGame(SpecialActionType.PolicyPeek);
      expect(policyPeekAction.isValid(game, "p1", {})).toBe(true);
    });

    it("cannot peek twice (peekedCards already set)", () => {
      const game = makeSpecialActionGame(SpecialActionType.PolicyPeek, {
        phase: {
          type: SecretVillainPhase.SpecialAction,
          startedAt: 1000,
          presidentId: "p1",
          actionType: SpecialActionType.PolicyPeek,
          peekedCards: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good],
        },
      });
      expect(policyPeekAction.isValid(game, "p1", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets peekedCards to the top 3 cards of the deck without removing them", () => {
      const deck = [
        PolicyCard.Bad,
        PolicyCard.Good,
        PolicyCard.Bad,
        PolicyCard.Good,
        PolicyCard.Good,
      ];
      const game = makeSpecialActionGame(SpecialActionType.PolicyPeek, {
        deck,
      });

      policyPeekAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      const phase = ts.phase as SpecialActionPhase;
      expect(phase.peekedCards).toEqual([
        PolicyCard.Bad,
        PolicyCard.Good,
        PolicyCard.Bad,
      ]);
      // Deck is unchanged
      expect(ts.deck).toEqual(deck);
      expect(ts.deck).toHaveLength(5);
    });
  });
});

// ─── resolvePolicyPeekAction ──────────────────────────────────────────────────

describe("resolvePolicyPeekAction", () => {
  function makePeekedGame(peeked: boolean) {
    return makeSpecialActionGame(SpecialActionType.PolicyPeek, {
      phase: {
        type: SecretVillainPhase.SpecialAction,
        startedAt: 1000,
        presidentId: "p1",
        actionType: SpecialActionType.PolicyPeek,
        ...(peeked
          ? {
              peekedCards: [
                PolicyCard.Good,
                PolicyCard.Bad,
                PolicyCard.Good,
              ] as [PolicyCard, PolicyCard, PolicyCard],
            }
          : {}),
      },
    });
  }

  describe("isValid", () => {
    it("president can resolve after peeking", () => {
      const game = makePeekedGame(true);
      expect(resolvePolicyPeekAction.isValid(game, "p1", {})).toBe(true);
    });

    it("cannot resolve before peeking", () => {
      const game = makePeekedGame(false);
      expect(resolvePolicyPeekAction.isValid(game, "p1", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("advances to ElectionNomination, deck unchanged", () => {
      const deck = [
        PolicyCard.Good,
        PolicyCard.Bad,
        PolicyCard.Good,
        PolicyCard.Bad,
      ];
      const game = makeSpecialActionGame(SpecialActionType.PolicyPeek, {
        deck,
        phase: {
          type: SecretVillainPhase.SpecialAction,
          startedAt: 1000,
          presidentId: "p1",
          actionType: SpecialActionType.PolicyPeek,
          peekedCards: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good],
        },
      });

      resolvePolicyPeekAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(SecretVillainPhase.ElectionNomination);
      expect(ts.deck).toEqual(deck);
    });
  });
});
