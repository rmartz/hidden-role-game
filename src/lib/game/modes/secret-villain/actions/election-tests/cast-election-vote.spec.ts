import { describe, expect, it } from "vitest";

import type { ElectionVotePhase } from "../../types";
import { SecretVillainPhase } from "../../types";
import { castElectionVoteAction } from "../cast-election-vote";
import { getTurnState, makeElectionGame } from "./helpers";

describe("castElectionVoteAction", () => {
  function makeVoteGame(
    votes: { playerId: string; vote: "yes" | "no" }[] = [],
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
    it("alive player can vote yes or no", () => {
      const game = makeVoteGame();
      expect(castElectionVoteAction.isValid(game, "p2", { vote: "yes" })).toBe(
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
      expect(castElectionVoteAction.isValid(game, "p2", { vote: "yes" })).toBe(
        false,
      );
    });

    it("player can change their vote", () => {
      const game = makeVoteGame([{ playerId: "p2", vote: "yes" }]);
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
      castElectionVoteAction.apply(game, { vote: "yes" }, "p2");

      const ts = getTurnState(game);
      const phase = ts.phase as ElectionVotePhase;
      expect(phase.votes).toEqual([{ playerId: "p2", vote: "yes" }]);
    });

    it("replaces existing vote when player re-votes", () => {
      const game = makeVoteGame([{ playerId: "p2", vote: "yes" }]);
      castElectionVoteAction.apply(game, { vote: "no" }, "p2");

      const ts = getTurnState(game);
      const phase = ts.phase as ElectionVotePhase;
      expect(phase.votes).toEqual([{ playerId: "p2", vote: "no" }]);
    });

    it("does not duplicate vote count on re-vote", () => {
      const game = makeVoteGame([
        { playerId: "p2", vote: "yes" },
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
