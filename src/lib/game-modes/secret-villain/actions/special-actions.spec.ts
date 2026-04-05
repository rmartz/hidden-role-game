import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "../timer-config";
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
import {
  selectInvestigationTargetAction,
  consentInvestigationAction,
  resolveInvestigationAction,
} from "./investigate-player";
import { callSpecialElectionAction } from "./call-special-election";
import { shootPlayerAction } from "./shoot-player";

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
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.SecretVillain },
  } satisfies Game;
}

function getTurnState(game: Game): SecretVillainTurnState {
  if (game.status.type !== GameStatus.Playing) throw new Error("Not playing");
  return game.status.turnState as SecretVillainTurnState;
}

// ─── selectInvestigationTargetAction ──────────────────────────────────────────

describe("selectInvestigationTargetAction", () => {
  describe("isValid", () => {
    it("president can select a non-eliminated target", () => {
      const game = makeSpecialActionGame(SpecialActionType.InvestigateTeam);
      expect(
        selectInvestigationTargetAction.isValid(game, "p1", {
          targetPlayerId: "p2",
        }),
      ).toBe(true);
    });

    it("cannot select self", () => {
      const game = makeSpecialActionGame(SpecialActionType.InvestigateTeam);
      expect(
        selectInvestigationTargetAction.isValid(game, "p1", {
          targetPlayerId: "p1",
        }),
      ).toBe(false);
    });

    it("cannot select eliminated player", () => {
      const game = makeSpecialActionGame(SpecialActionType.InvestigateTeam, {
        eliminatedPlayerIds: ["p3"],
      });
      expect(
        selectInvestigationTargetAction.isValid(game, "p1", {
          targetPlayerId: "p3",
        }),
      ).toBe(false);
    });

    it("non-president cannot select", () => {
      const game = makeSpecialActionGame(SpecialActionType.InvestigateTeam);
      expect(
        selectInvestigationTargetAction.isValid(game, "p2", {
          targetPlayerId: "p3",
        }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets targetPlayerId on the phase", () => {
      const game = makeSpecialActionGame(SpecialActionType.InvestigateTeam);
      selectInvestigationTargetAction.apply(
        game,
        { targetPlayerId: "p3" },
        "p1",
      );

      const ts = getTurnState(game);
      const phase = ts.phase as SpecialActionPhase;
      expect(phase.targetPlayerId).toBe("p3");
    });
  });
});

// ─── consentInvestigationAction ───────────────────────────────────────────────

describe("consentInvestigationAction", () => {
  function makeConsentGame(targetPlayerId: string, consented = false) {
    return makeSpecialActionGame(SpecialActionType.InvestigateTeam, {
      phase: {
        type: SecretVillainPhase.SpecialAction,
        startedAt: 1000,
        presidentId: "p1",
        actionType: SpecialActionType.InvestigateTeam,
        targetPlayerId,
        ...(consented ? { targetConsented: true } : {}),
      },
    });
  }

  describe("isValid", () => {
    it("target player can consent", () => {
      const game = makeConsentGame("p2");
      expect(consentInvestigationAction.isValid(game, "p2", {})).toBe(true);
    });

    it("non-target cannot consent", () => {
      const game = makeConsentGame("p2");
      expect(consentInvestigationAction.isValid(game, "p3", {})).toBe(false);
    });

    it("cannot consent twice", () => {
      const game = makeConsentGame("p2", true);
      expect(consentInvestigationAction.isValid(game, "p2", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets targetConsented and revealedTeam Good for a Good player", () => {
      const game = makeConsentGame("p2");
      consentInvestigationAction.apply(game, {}, "p2");

      const phase = getTurnState(game).phase as SpecialActionPhase;
      expect(phase.targetConsented).toBe(true);
      expect(phase.revealedTeam).toBe("Good");
    });

    it("sets targetConsented and revealedTeam Bad for a Bad player", () => {
      const game = makeConsentGame("p4");
      consentInvestigationAction.apply(game, {}, "p4");

      const phase = getTurnState(game).phase as SpecialActionPhase;
      expect(phase.targetConsented).toBe(true);
      expect(phase.revealedTeam).toBe("Bad");
    });
  });
});

// ─── resolveInvestigationAction ───────────────────────────────────────────────

describe("resolveInvestigationAction", () => {
  function makeResolveGame(consented: boolean) {
    return makeSpecialActionGame(SpecialActionType.InvestigateTeam, {
      phase: {
        type: SecretVillainPhase.SpecialAction,
        startedAt: 1000,
        presidentId: "p1",
        actionType: SpecialActionType.InvestigateTeam,
        targetPlayerId: "p2",
        ...(consented
          ? { targetConsented: true, revealedTeam: "Good" as const }
          : {}),
      },
    });
  }

  describe("isValid", () => {
    it("president can resolve after consent", () => {
      const game = makeResolveGame(true);
      expect(resolveInvestigationAction.isValid(game, "p1", {})).toBe(true);
    });

    it("cannot resolve before consent", () => {
      const game = makeResolveGame(false);
      expect(resolveInvestigationAction.isValid(game, "p1", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("advances to next ElectionNomination phase", () => {
      const game = makeResolveGame(true);
      resolveInvestigationAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(SecretVillainPhase.ElectionNomination);
      expect(ts.turn).toBe(2);
    });
  });
});

// ─── callSpecialElectionAction ────────────────────────────────────────────────

describe("callSpecialElectionAction", () => {
  describe("isValid", () => {
    it("president can select a non-eliminated target", () => {
      const game = makeSpecialActionGame(SpecialActionType.SpecialElection);
      expect(
        callSpecialElectionAction.isValid(game, "p1", { targetPlayerId: "p3" }),
      ).toBe(true);
    });

    it("cannot select self", () => {
      const game = makeSpecialActionGame(SpecialActionType.SpecialElection);
      expect(
        callSpecialElectionAction.isValid(game, "p1", { targetPlayerId: "p1" }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets specialPresidentId and transitions to ElectionNomination", () => {
      const game = makeSpecialActionGame(SpecialActionType.SpecialElection);
      callSpecialElectionAction.apply(game, { targetPlayerId: "p3" }, "p1");

      const ts = getTurnState(game);
      expect(ts.specialPresidentId).toBe("p3");
      expect(ts.phase.type).toBe(SecretVillainPhase.ElectionNomination);
      expect(ts.phase).toMatchObject({ presidentId: "p3" });
      expect(ts.turn).toBe(2);
    });
  });
});

// ─── shootPlayerAction ────────────────────────────────────────────────────────

describe("shootPlayerAction", () => {
  describe("isValid", () => {
    it("president can shoot a non-eliminated target", () => {
      const game = makeSpecialActionGame(SpecialActionType.Shoot);
      expect(
        shootPlayerAction.isValid(game, "p1", { targetPlayerId: "p3" }),
      ).toBe(true);
    });

    it("cannot shoot self", () => {
      const game = makeSpecialActionGame(SpecialActionType.Shoot);
      expect(
        shootPlayerAction.isValid(game, "p1", { targetPlayerId: "p1" }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("adds target to eliminatedPlayerIds and advances to election", () => {
      const game = makeSpecialActionGame(SpecialActionType.Shoot);
      shootPlayerAction.apply(game, { targetPlayerId: "p3" }, "p1");

      const ts = getTurnState(game);
      expect(ts.eliminatedPlayerIds).toContain("p3");
      expect(ts.phase.type).toBe(SecretVillainPhase.ElectionNomination);
      expect(ts.turn).toBe(2);
    });

    it("shooting Special Bad wins the game for Good team", () => {
      const game = makeSpecialActionGame(SpecialActionType.Shoot);
      shootPlayerAction.apply(game, { targetPlayerId: "p5" }, "p1");

      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Good");
      }
    });
  });
});
