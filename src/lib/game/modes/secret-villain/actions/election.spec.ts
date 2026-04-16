import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "../timer-config";
import type { Game } from "@/lib/types";
import {
  SecretVillainPhase,
  PolicyCard,
  FAILED_ELECTION_THRESHOLD,
  BAD_CARDS_FOR_SPECIAL_BAD_WIN,
  SvBoardPreset,
} from "../types";
import type { SecretVillainTurnState, ElectionVotePhase } from "../types";
import { BOARD_PRESETS } from "../utils";
import { SecretVillainRole } from "../roles";
import { nominateChancellorAction } from "./nominate-chancellor";
import { castElectionVoteAction } from "./cast-election-vote";
import {
  resolveElectionAction,
  advanceFromElectionAction,
} from "./resolve-election";

function makePlayer(id: string) {
  return {
    id,
    name: `Player ${id}`,
    sessionId: `session-${id}`,
    visiblePlayers: [],
  };
}

function makeElectionGame(
  overrides: {
    turnState?: Partial<SecretVillainTurnState>;
    status?: Game["status"];
    roleAssignments?: Game["roleAssignments"];
  } = {},
): Game {
  const baseTurnState: SecretVillainTurnState = {
    presidentOrder: ["p1", "p2", "p3", "p4", "p5"],
    currentPresidentIndex: 0,
    turn: 1,
    phase: {
      type: SecretVillainPhase.ElectionNomination,
      startedAt: 1000,
      presidentId: "p1",
    },
    goodCardsPlayed: 0,
    badCardsPlayed: 0,
    deck: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good],
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
    players: ["p1", "p2", "p3", "p4", "p5"].map(makePlayer),
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

// ─── nominateChancellorAction ───────────────────────────────────────────────

describe("nominateChancellorAction", () => {
  describe("isValid", () => {
    it("president can nominate an eligible player", () => {
      const game = makeElectionGame();
      expect(
        nominateChancellorAction.isValid(game, "p1", { chancellorId: "p2" }),
      ).toBe(true);
    });

    it("non-president cannot nominate", () => {
      const game = makeElectionGame();
      expect(
        nominateChancellorAction.isValid(game, "p2", { chancellorId: "p3" }),
      ).toBe(false);
    });

    it("cannot nominate self", () => {
      const game = makeElectionGame();
      expect(
        nominateChancellorAction.isValid(game, "p1", { chancellorId: "p1" }),
      ).toBe(false);
    });

    it("cannot nominate eliminated player", () => {
      const game = makeElectionGame({
        turnState: { eliminatedPlayerIds: ["p3"] },
      });
      expect(
        nominateChancellorAction.isValid(game, "p1", { chancellorId: "p3" }),
      ).toBe(false);
    });

    it("cannot nominate previous chancellor", () => {
      const game = makeElectionGame({
        turnState: { previousChancellorId: "p2" },
      });
      expect(
        nominateChancellorAction.isValid(game, "p1", { chancellorId: "p2" }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("transitions to ElectionVote phase with correct data", () => {
      const game = makeElectionGame();
      nominateChancellorAction.apply(game, { chancellorId: "p3" }, "p1");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(SecretVillainPhase.ElectionVote);
      const phase = ts.phase as ElectionVotePhase;
      expect(phase.presidentId).toBe("p1");
      expect(phase.chancellorNomineeId).toBe("p3");
      expect(phase.votes).toEqual([]);
    });
  });
});

// ─── castElectionVoteAction ─────────────────────────────────────────────────

describe("castElectionVoteAction", () => {
  function makeVoteGame(
    votes: { playerId: string; vote: "aye" | "no" }[] = [],
  ) {
    return makeElectionGame({
      turnState: {
        phase: {
          type: SecretVillainPhase.ElectionVote,
          startedAt: 1000,
          presidentId: "p1",
          chancellorNomineeId: "p3",
          votes,
        },
      },
    });
  }

  describe("isValid", () => {
    it("alive player can vote aye or no", () => {
      const game = makeVoteGame();
      expect(castElectionVoteAction.isValid(game, "p2", { vote: "aye" })).toBe(
        true,
      );
      expect(castElectionVoteAction.isValid(game, "p2", { vote: "no" })).toBe(
        true,
      );
    });

    it("eliminated player cannot vote", () => {
      const game = makeVoteGame();
      const ts = getTurnState(game);
      ts.eliminatedPlayerIds = ["p2"];
      expect(castElectionVoteAction.isValid(game, "p2", { vote: "aye" })).toBe(
        false,
      );
    });

    it("player can change their vote", () => {
      const game = makeVoteGame([{ playerId: "p2", vote: "aye" }]);
      expect(castElectionVoteAction.isValid(game, "p2", { vote: "no" })).toBe(
        true,
      );
    });

    it("invalid vote value rejected", () => {
      const game = makeVoteGame();
      expect(
        castElectionVoteAction.isValid(game, "p2", { vote: "maybe" }),
      ).toBe(false);
      expect(castElectionVoteAction.isValid(game, "p2", { vote: 123 })).toBe(
        false,
      );
    });
  });

  describe("apply", () => {
    it("adds vote to the phase", () => {
      const game = makeVoteGame();
      castElectionVoteAction.apply(game, { vote: "aye" }, "p2");

      const ts = getTurnState(game);
      const phase = ts.phase as ElectionVotePhase;
      expect(phase.votes).toEqual([{ playerId: "p2", vote: "aye" }]);
    });

    it("replaces existing vote when player re-votes", () => {
      const game = makeVoteGame([{ playerId: "p2", vote: "aye" }]);
      castElectionVoteAction.apply(game, { vote: "no" }, "p2");

      const ts = getTurnState(game);
      const phase = ts.phase as ElectionVotePhase;
      expect(phase.votes).toEqual([{ playerId: "p2", vote: "no" }]);
    });

    it("does not duplicate vote count on re-vote", () => {
      const game = makeVoteGame([
        { playerId: "p2", vote: "aye" },
        { playerId: "p3", vote: "no" },
      ]);
      castElectionVoteAction.apply(game, { vote: "no" }, "p2");

      const ts = getTurnState(game);
      const phase = ts.phase as ElectionVotePhase;
      expect(phase.votes).toHaveLength(2);
      expect(phase.votes[0]).toEqual({ playerId: "p2", vote: "no" });
      expect(phase.votes[1]).toEqual({ playerId: "p3", vote: "no" });
    });
  });
});

// ─── resolveElectionAction ──────────────────────────────────────────────────

describe("resolveElectionAction", () => {
  function allVotes(vote: "aye" | "no") {
    return ["p1", "p2", "p3", "p4", "p5"].map((id) => ({ playerId: id, vote }));
  }

  function makeResolveGame(
    votes: { playerId: string; vote: "aye" | "no" }[],
    extraTurnState: Partial<SecretVillainTurnState> = {},
  ) {
    return makeElectionGame({
      turnState: {
        phase: {
          type: SecretVillainPhase.ElectionVote,
          startedAt: 1000,
          presidentId: "p1",
          chancellorNomineeId: "p3",
          votes,
        },
        ...extraTurnState,
      },
    });
  }

  describe("isValid", () => {
    it("can resolve when all alive players have voted", () => {
      const game = makeResolveGame(allVotes("aye"));
      expect(resolveElectionAction.isValid(game, "p1", {})).toBe(true);
    });

    it("can resolve before all votes are in (timer expiry case)", () => {
      const game = makeResolveGame([{ playerId: "p1", vote: "aye" }]);
      expect(resolveElectionAction.isValid(game, "p1", {})).toBe(true);
    });
  });

  describe("apply", () => {
    it("passed: transitions to PolicyPresident phase and resets failedElectionCount", () => {
      const game = makeResolveGame(allVotes("aye"), { failedElectionCount: 1 });
      resolveElectionAction.apply(game, {}, "p1");
      advanceFromElectionAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(SecretVillainPhase.PolicyPresident);
      expect(ts.failedElectionCount).toBe(0);
    });

    it("failed: increments failedElectionCount and advances to next president", () => {
      const game = makeResolveGame(allVotes("no"));
      resolveElectionAction.apply(game, {}, "p1");
      advanceFromElectionAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      expect(ts.failedElectionCount).toBe(1);
      expect(ts.phase.type).toBe(SecretVillainPhase.ElectionNomination);
      expect(ts.turn).toBe(2);
    });

    it("failed: clears specialPresidentId so rotation resumes normally", () => {
      const game = makeResolveGame(allVotes("no"), {
        specialPresidentId: "p4",
        currentPresidentIndex: 2,
      });
      resolveElectionAction.apply(game, {}, "p1");
      advanceFromElectionAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      expect(ts.specialPresidentId).toBeUndefined();
      // Rotation resumes from the saved index (p3), not the special president
      expect(ts.phase.type).toBe(SecretVillainPhase.ElectionNomination);
    });

    it("failed at threshold: auto-plays top card, resets counter, clears previous administration", () => {
      const game = makeResolveGame(allVotes("no"), {
        failedElectionCount: FAILED_ELECTION_THRESHOLD - 1,
        deck: [PolicyCard.Bad, PolicyCard.Good, PolicyCard.Good],
        previousPresidentId: "p2",
        previousChancellorId: "p3",
      });
      resolveElectionAction.apply(game, {}, "p1");
      advanceFromElectionAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      expect(ts.failedElectionCount).toBe(0);
      expect(ts.badCardsPlayed).toBe(1);
      expect(ts.previousPresidentId).toBeUndefined();
      expect(ts.previousChancellorId).toBeUndefined();
    });

    it("passed: Special Bad as chancellor after 3+ bad cards triggers Bad team win", () => {
      const game = makeResolveGame(allVotes("aye"), {
        badCardsPlayed: BAD_CARDS_FOR_SPECIAL_BAD_WIN,
      });
      // Override nominee to be the SpecialBad player (p5)
      const ts = getTurnState(game);
      (ts.phase as ElectionVotePhase).chancellorNomineeId = "p5";

      resolveElectionAction.apply(game, {}, "p1");
      advanceFromElectionAction.apply(game, {}, "p1");

      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Bad");
      }
    });

    it("auto-play Good card wins when 5th Good card auto-played", () => {
      const game = makeResolveGame(allVotes("no"), {
        failedElectionCount: FAILED_ELECTION_THRESHOLD - 1,
        goodCardsPlayed: 4,
        deck: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Bad],
      });
      resolveElectionAction.apply(game, {}, "p1");
      advanceFromElectionAction.apply(game, {}, "p1");

      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Good");
      }
    });
  });
});
