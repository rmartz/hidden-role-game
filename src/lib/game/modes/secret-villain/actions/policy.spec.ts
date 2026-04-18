import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "../timer-config";
import type { Game } from "@/lib/types";
import {
  SecretVillainPhase,
  PolicyCard,
  GOOD_CARDS_TO_WIN,
  BAD_CARDS_TO_WIN,
  SpecialActionType,
  SvBoardPreset,
} from "../types";
import type { SecretVillainTurnState, PolicyChancellorPhase } from "../types";
import { BOARD_PRESETS, SvVictoryConditionKey } from "../utils";
import { SecretVillainRole } from "../roles";
import { presidentDiscardAction } from "./president-discard";
import { chancellorPlayAction } from "./chancellor-play";

function makePlayer(id: string) {
  return {
    id,
    name: `Player ${id}`,
    sessionId: `session-${id}`,
    visiblePlayers: [],
  };
}

function makePolicyGame(
  overrides: {
    turnState?: Partial<SecretVillainTurnState>;
    status?: Game["status"];
    roleAssignments?: Game["roleAssignments"];
    playerCount?: number;
  } = {},
): Game {
  const count = overrides.playerCount ?? 5;
  const playerIds = Array.from({ length: count }, (_, i) => `p${i + 1}`);

  const baseTurnState: SecretVillainTurnState = {
    presidentOrder: playerIds,
    currentPresidentIndex: 0,
    turn: 1,
    phase: {
      type: SecretVillainPhase.PolicyPresident,
      startedAt: 1000,
      presidentId: "p1",
      chancellorId: "p3",
      drawnCards: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good],
    },
    goodCardsPlayed: 0,
    badCardsPlayed: 0,
    deck: [PolicyCard.Bad, PolicyCard.Good, PolicyCard.Bad],
    discardPile: [],
    eliminatedPlayerIds: [],
    failedElectionCount: 0,
    boardPreset: SvBoardPreset.Medium,
    powerTable: BOARD_PRESETS[SvBoardPreset.Medium],
    ...overrides.turnState,
  };

  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: overrides.status ?? {
      type: GameStatus.Playing,
      turnState: baseTurnState,
    },
    players: playerIds.map(makePlayer),
    roleAssignments: overrides.roleAssignments ?? [
      { playerId: "p1", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p2", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p3", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p4", roleDefinitionId: SecretVillainRole.Bad },
      { playerId: "p5", roleDefinitionId: SecretVillainRole.SpecialBad },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.SecretVillain },
  } satisfies Game;
}

function getTurnState(game: Game): SecretVillainTurnState {
  if (game.status.type !== GameStatus.Playing) throw new Error("Not playing");
  return game.status.turnState as SecretVillainTurnState;
}

// ─── presidentDiscardAction ─────────────────────────────────────────────────

describe("presidentDiscardAction", () => {
  describe("isValid", () => {
    it("president can discard a card by index (0, 1, or 2)", () => {
      const game = makePolicyGame();
      expect(presidentDiscardAction.isValid(game, "p1", { cardIndex: 0 })).toBe(
        true,
      );
      expect(presidentDiscardAction.isValid(game, "p1", { cardIndex: 1 })).toBe(
        true,
      );
      expect(presidentDiscardAction.isValid(game, "p1", { cardIndex: 2 })).toBe(
        true,
      );
    });

    it("non-president cannot discard", () => {
      const game = makePolicyGame();
      expect(presidentDiscardAction.isValid(game, "p2", { cardIndex: 0 })).toBe(
        false,
      );
    });

    it("cannot discard with invalid index (negative, >=3, non-number)", () => {
      const game = makePolicyGame();
      expect(
        presidentDiscardAction.isValid(game, "p1", { cardIndex: -1 }),
      ).toBe(false);
      expect(presidentDiscardAction.isValid(game, "p1", { cardIndex: 3 })).toBe(
        false,
      );
      expect(
        presidentDiscardAction.isValid(game, "p1", { cardIndex: "zero" }),
      ).toBe(false);
    });

    it("cannot discard when already discarded", () => {
      const game = makePolicyGame({
        turnState: {
          phase: {
            type: SecretVillainPhase.PolicyPresident,
            startedAt: 1000,
            presidentId: "p1",
            chancellorId: "p3",
            drawnCards: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good],
            discardedCard: PolicyCard.Bad,
          },
        },
      });
      expect(presidentDiscardAction.isValid(game, "p1", { cardIndex: 0 })).toBe(
        false,
      );
    });
  });

  describe("apply", () => {
    it("transitions to PolicyChancellor phase with remaining 2 cards", () => {
      const game = makePolicyGame();
      presidentDiscardAction.apply(game, { cardIndex: 1 }, "p1");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(SecretVillainPhase.PolicyChancellor);
      const phase = ts.phase as PolicyChancellorPhase;
      expect(phase.presidentId).toBe("p1");
      expect(phase.chancellorId).toBe("p3");
      // Discarded index 1 (Bad), remaining are [Good, Good]
      expect(phase.remainingCards).toEqual([PolicyCard.Good, PolicyCard.Good]);
      expect(ts.discardPile).toEqual([PolicyCard.Bad]);
    });
  });
});

// ─── chancellorPlayAction ───────────────────────────────────────────────────

describe("chancellorPlayAction", () => {
  function makeChancellorGame(
    overrides: Partial<SecretVillainTurnState> = {},
    playerCount?: number,
  ) {
    return makePolicyGame({
      playerCount,
      turnState: {
        phase: {
          type: SecretVillainPhase.PolicyChancellor,
          startedAt: 1000,
          presidentId: "p1",
          chancellorId: "p3",
          remainingCards: [PolicyCard.Good, PolicyCard.Bad],
        },
        ...overrides,
      },
    });
  }

  describe("isValid", () => {
    it("chancellor can play a card by index (0 or 1)", () => {
      const game = makeChancellorGame();
      expect(chancellorPlayAction.isValid(game, "p3", { cardIndex: 0 })).toBe(
        true,
      );
      expect(chancellorPlayAction.isValid(game, "p3", { cardIndex: 1 })).toBe(
        true,
      );
    });

    it("non-chancellor cannot play", () => {
      const game = makeChancellorGame();
      expect(chancellorPlayAction.isValid(game, "p1", { cardIndex: 0 })).toBe(
        false,
      );
    });

    it("cannot play with invalid index", () => {
      const game = makeChancellorGame();
      expect(chancellorPlayAction.isValid(game, "p3", { cardIndex: -1 })).toBe(
        false,
      );
      expect(chancellorPlayAction.isValid(game, "p3", { cardIndex: 2 })).toBe(
        false,
      );
      expect(
        chancellorPlayAction.isValid(game, "p3", { cardIndex: "one" }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("playing Good card increments goodCardsPlayed", () => {
      const game = makeChancellorGame();
      // Index 0 is Good
      chancellorPlayAction.apply(game, { cardIndex: 0 }, "p3");

      const ts = getTurnState(game);
      expect(ts.goodCardsPlayed).toBe(1);
      expect(ts.badCardsPlayed).toBe(0);
      // The other card (Bad) goes to discard
      expect(ts.discardPile).toContain(PolicyCard.Bad);
    });

    it("playing Bad card increments badCardsPlayed", () => {
      const game = makeChancellorGame();
      // Index 1 is Bad
      chancellorPlayAction.apply(game, { cardIndex: 1 }, "p3");

      const ts = getTurnState(game);
      expect(ts.badCardsPlayed).toBe(1);
      expect(ts.goodCardsPlayed).toBe(0);
      // The other card (Good) goes to discard
      expect(ts.discardPile).toContain(PolicyCard.Good);
    });

    it("updates previousPresidentId and previousChancellorId", () => {
      const game = makeChancellorGame();
      chancellorPlayAction.apply(game, { cardIndex: 0 }, "p3");

      const ts = getTurnState(game);
      expect(ts.previousPresidentId).toBe("p1");
      expect(ts.previousChancellorId).toBe("p3");
    });

    it("5th Good card triggers Good team win", () => {
      const game = makeChancellorGame({
        goodCardsPlayed: GOOD_CARDS_TO_WIN - 1,
      });
      chancellorPlayAction.apply(game, { cardIndex: 0 }, "p3");

      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Good");
        expect(game.status.victoryConditionKey).toBe(
          SvVictoryConditionKey.GoodPolicy,
        );
      }
    });

    it("6th Bad card triggers Bad team win", () => {
      const game = makeChancellorGame({
        badCardsPlayed: BAD_CARDS_TO_WIN - 1,
        phase: {
          type: SecretVillainPhase.PolicyChancellor,
          startedAt: 1000,
          presidentId: "p1",
          chancellorId: "p3",
          remainingCards: [PolicyCard.Bad, PolicyCard.Good],
        },
      });
      chancellorPlayAction.apply(game, { cardIndex: 0 }, "p3");

      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Bad");
        expect(game.status.victoryConditionKey).toBe(
          SvVictoryConditionKey.BadPolicy,
        );
      }
    });

    it("Bad card triggers special action when applicable", () => {
      // 7 players: bad card 2 triggers InvestigateTeam
      const game = makeChancellorGame(
        {
          badCardsPlayed: 1,
          phase: {
            type: SecretVillainPhase.PolicyChancellor,
            startedAt: 1000,
            presidentId: "p1",
            chancellorId: "p3",
            remainingCards: [PolicyCard.Bad, PolicyCard.Good],
          },
        },
        7,
      );
      chancellorPlayAction.apply(game, { cardIndex: 0 }, "p3");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(SecretVillainPhase.SpecialAction);
      if (ts.phase.type === SecretVillainPhase.SpecialAction) {
        expect(ts.phase.actionType).toBe(SpecialActionType.InvestigateTeam);
        expect(ts.phase.presidentId).toBe("p1");
      }
    });

    it("Good card does not trigger special action, advances to next election", () => {
      const game = makeChancellorGame({ badCardsPlayed: 1 }, 7);
      // Play Good (index 0)
      chancellorPlayAction.apply(game, { cardIndex: 0 }, "p3");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(SecretVillainPhase.ElectionNomination);
      expect(ts.turn).toBe(2);
    });

    it("Bad card with no special action advances to next election", () => {
      // 5 players: bad card 1 has no special action
      const game = makeChancellorGame({
        badCardsPlayed: 0,
        phase: {
          type: SecretVillainPhase.PolicyChancellor,
          startedAt: 1000,
          presidentId: "p1",
          chancellorId: "p3",
          remainingCards: [PolicyCard.Bad, PolicyCard.Good],
        },
      });
      chancellorPlayAction.apply(game, { cardIndex: 0 }, "p3");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(SecretVillainPhase.ElectionNomination);
      expect(ts.turn).toBe(2);
    });
  });
});
