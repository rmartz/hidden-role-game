import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "../timer-config";
import {
  SecretVillainPhase,
  PolicyCard,
  SvBoardPreset,
  BAD_CARDS_FOR_SPECIAL_BAD_WIN,
} from "../types";
import type { SecretVillainTurnState, SpecialBadRevealPhase } from "../types";
import { BOARD_PRESETS } from "../utils";
import { SecretVillainRole } from "../roles";
import {
  confirmSpecialBadAction,
  denySpecialBadAction,
  advanceFromSpecialBadRevealAction,
} from "./special-bad-reveal";
import { SecretVillainWinner } from "../utils/win-condition";

function makeRevealGame(
  revealPhaseOverrides: Partial<SpecialBadRevealPhase> = {},
): Game {
  const phase: SpecialBadRevealPhase = {
    type: SecretVillainPhase.SpecialBadReveal,
    startedAt: 1000,
    presidentId: "p1",
    chancellorId: "p5",
    ...revealPhaseOverrides,
  };
  const turnState: SecretVillainTurnState = {
    presidentOrder: ["p1", "p2", "p3", "p4", "p5"],
    currentPresidentIndex: 1,
    turn: 1,
    phase,
    goodCardsPlayed: 0,
    badCardsPlayed: BAD_CARDS_FOR_SPECIAL_BAD_WIN,
    deck: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good, PolicyCard.Bad],
    discardPile: [],
    eliminatedPlayerIds: [],
    failedElectionCount: 0,
    boardPreset: SvBoardPreset.Medium,
    powerTable: BOARD_PRESETS[SvBoardPreset.Medium],
  };
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: { type: GameStatus.Playing, turnState },
    players: ["p1", "p2", "p3", "p4", "p5"].map((id) => ({
      id,
      name: `Player ${id}`,
      sessionId: `session-${id}`,
      visiblePlayers: [],
    })),
    roleAssignments: [
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

// ─── confirmSpecialBadAction ─────────────────────────────────────────────────

describe("confirmSpecialBadAction", () => {
  describe("isValid", () => {
    it("returns true for the chancellor in SpecialBadReveal phase", () => {
      const game = makeRevealGame();
      expect(confirmSpecialBadAction.isValid(game, "p5", {})).toBe(true);
    });

    it("returns false for a non-chancellor player", () => {
      const game = makeRevealGame();
      expect(confirmSpecialBadAction.isValid(game, "p1", {})).toBe(false);
    });

    it("returns false after revealed is already set", () => {
      const game = makeRevealGame({ revealed: false });
      expect(confirmSpecialBadAction.isValid(game, "p5", {})).toBe(false);
    });

    it("returns false outside SpecialBadReveal phase", () => {
      const game = makeRevealGame();
      (getTurnState(game).phase as unknown as { type: string }).type =
        SecretVillainPhase.ElectionNomination;
      expect(confirmSpecialBadAction.isValid(game, "p5", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets revealed to false", () => {
      const game = makeRevealGame();
      confirmSpecialBadAction.apply(game, {}, "p5");
      const phase = getTurnState(game).phase as SpecialBadRevealPhase;
      expect(phase.revealed).toBe(false);
    });
  });
});

// ─── denySpecialBadAction ────────────────────────────────────────────────────

describe("denySpecialBadAction", () => {
  describe("isValid", () => {
    it("returns true for the chancellor in SpecialBadReveal phase", () => {
      const game = makeRevealGame();
      expect(denySpecialBadAction.isValid(game, "p5", {})).toBe(true);
    });

    it("returns false for a non-chancellor player", () => {
      const game = makeRevealGame();
      expect(denySpecialBadAction.isValid(game, "p2", {})).toBe(false);
    });

    it("returns false after revealed is already set", () => {
      const game = makeRevealGame({ revealed: true });
      expect(denySpecialBadAction.isValid(game, "p5", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets revealed to true", () => {
      const game = makeRevealGame();
      denySpecialBadAction.apply(game, {}, "p5");
      const phase = getTurnState(game).phase as SpecialBadRevealPhase;
      expect(phase.revealed).toBe(true);
    });
  });
});

// ─── advanceFromSpecialBadRevealAction ───────────────────────────────────────

describe("advanceFromSpecialBadRevealAction", () => {
  describe("isValid", () => {
    it("returns true once revealed is set", () => {
      const game = makeRevealGame({ revealed: false });
      expect(advanceFromSpecialBadRevealAction.isValid(game, "p1", {})).toBe(
        true,
      );
    });

    it("returns false before chancellor has acted", () => {
      const game = makeRevealGame();
      expect(advanceFromSpecialBadRevealAction.isValid(game, "p1", {})).toBe(
        false,
      );
    });
  });

  describe("apply — revealed = true", () => {
    it("ends the game with Bad team winning", () => {
      const game = makeRevealGame({ revealed: true });
      advanceFromSpecialBadRevealAction.apply(game, {}, "p1");
      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe(SecretVillainWinner.Bad);
      }
    });
  });

  describe("apply — revealed = false", () => {
    it("transitions to PolicyPresident phase", () => {
      const game = makeRevealGame({ revealed: false });
      advanceFromSpecialBadRevealAction.apply(game, {}, "p1");
      expect(game.status.type).toBe(GameStatus.Playing);
      const phase = getTurnState(game).phase;
      expect(phase.type).toBe(SecretVillainPhase.PolicyPresident);
    });

    it("preserves presidentId and chancellorId in the policy phase", () => {
      const game = makeRevealGame({ revealed: false });
      advanceFromSpecialBadRevealAction.apply(game, {}, "p1");
      const phase = getTurnState(game).phase;
      if (phase.type === SecretVillainPhase.PolicyPresident) {
        expect(phase.presidentId).toBe("p1");
        expect(phase.chancellorId).toBe("p5");
      }
    });

    it("draws 3 cards from the deck for the policy phase", () => {
      const game = makeRevealGame({ revealed: false });
      const deckSizeBefore = getTurnState(game).deck.length;
      advanceFromSpecialBadRevealAction.apply(game, {}, "p1");
      const ts = getTurnState(game);
      expect(ts.deck.length).toBe(deckSizeBefore - 3);
      const phase = ts.phase;
      if (phase.type === SecretVillainPhase.PolicyPresident) {
        expect(phase.drawnCards).toHaveLength(3);
      }
    });
  });
});
