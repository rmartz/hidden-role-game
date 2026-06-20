import { describe, expect, it } from "vitest";

import { GameStatus } from "@/lib/types";

import type { ElectionVotePhase, SecretVillainTurnState } from "../../types";
import {
  BAD_CARDS_FOR_SPECIAL_BAD_WIN,
  FAILED_ELECTION_THRESHOLD,
  PolicyCard,
  SecretVillainPhase,
} from "../../types";
import { SvVictoryConditionKey } from "../../utils";
import {
  advanceFromElectionAction,
  resolveElectionAction,
} from "../resolve-election";
import { getTurnState, makeElectionGame } from "./helpers";

describe("resolveElectionAction", () => {
  function allVotes(vote: "yes" | "no") {
    return ["p1", "p2", "p3", "p4", "p5"].map((id) => ({ playerId: id, vote }));
  }

  function makeResolveGame(
    votes: { playerId: string; vote: "yes" | "no" }[],
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
      const game = makeResolveGame(allVotes("yes"));
      expect(resolveElectionAction.isValid(game, "p1", {})).toBe(true);
    });

    it("can resolve before all votes are in (timer expiry case)", () => {
      const game = makeResolveGame([{ playerId: "p1", vote: "yes" }]);
      expect(resolveElectionAction.isValid(game, "p1", {})).toBe(true);
    });
  });

  describe("apply", () => {
    it("passed: transitions to PolicyPresident phase and resets failedElectionCount", () => {
      const game = makeResolveGame(allVotes("yes"), { failedElectionCount: 1 });
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

    it("passed: Special Bad as chancellor after 3+ bad cards enters SpecialBadReveal phase", () => {
      const game = makeResolveGame(allVotes("yes"), {
        badCardsPlayed: BAD_CARDS_FOR_SPECIAL_BAD_WIN,
      });
      // Override nominee to be the SpecialBad player (p5)
      const ts = getTurnState(game);
      (ts.phase as ElectionVotePhase).chancellorNomineeId = "p5";

      resolveElectionAction.apply(game, {}, "p1");
      advanceFromElectionAction.apply(game, {}, "p1");

      expect(game.status.type).toBe(GameStatus.Playing);
      const newPhase = getTurnState(game).phase;
      expect(newPhase.type).toBe(SecretVillainPhase.SpecialBadReveal);
      if (newPhase.type === SecretVillainPhase.SpecialBadReveal) {
        expect(newPhase.chancellorId).toBe("p5");
        expect(newPhase.revealed).toBeUndefined();
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
        expect(game.status.victoryConditionKey).toBe(
          SvVictoryConditionKey.Chaos,
        );
      }
    });
  });
});
