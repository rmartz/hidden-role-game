import { describe, it, expect } from "vitest";
import { TeamVote } from "../../types";
import type { TeamVotePhase } from "../../types";
import { castTeamVoteAction } from "../cast-team-vote";
import {
  makeGame,
  makeProposalTurnState,
  makeVoteTurnState,
  getTurnState,
} from "./helpers";

describe("castTeamVoteAction", () => {
  describe("isValid", () => {
    it("player can vote Approve", () => {
      const game = makeGame(makeVoteTurnState());
      expect(
        castTeamVoteAction.isValid(game, "p2", { vote: TeamVote.Approve }),
      ).toBe(true);
    });

    it("player can vote Reject", () => {
      const game = makeGame(makeVoteTurnState());
      expect(
        castTeamVoteAction.isValid(game, "p2", { vote: TeamVote.Reject }),
      ).toBe(true);
    });

    it("player can change their existing vote", () => {
      const game = makeGame(
        makeVoteTurnState([{ playerId: "p2", vote: TeamVote.Approve }]),
      );
      expect(
        castTeamVoteAction.isValid(game, "p2", { vote: TeamVote.Reject }),
      ).toBe(true);
    });

    it("rejects invalid vote value", () => {
      const game = makeGame(makeVoteTurnState());
      expect(castTeamVoteAction.isValid(game, "p2", { vote: "maybe" })).toBe(
        false,
      );
    });

    it("rejects non-existent player", () => {
      const game = makeGame(makeVoteTurnState());
      expect(
        castTeamVoteAction.isValid(game, "unknown", { vote: TeamVote.Approve }),
      ).toBe(false);
    });

    it("rejects voting after vote is resolved", () => {
      const game = makeGame(makeVoteTurnState([], true));
      expect(
        castTeamVoteAction.isValid(game, "p2", { vote: TeamVote.Approve }),
      ).toBe(false);
    });

    it("rejects when not in TeamVote phase", () => {
      const game = makeGame(makeProposalTurnState());
      expect(
        castTeamVoteAction.isValid(game, "p1", { vote: TeamVote.Approve }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("adds a new vote to the phase", () => {
      const game = makeGame(makeVoteTurnState());
      castTeamVoteAction.apply(game, { vote: TeamVote.Approve }, "p2");

      const ts = getTurnState(game);
      const phase = ts.phase as TeamVotePhase;
      expect(phase.votes).toEqual([{ playerId: "p2", vote: TeamVote.Approve }]);
    });

    it("replaces existing vote when player re-votes", () => {
      const game = makeGame(
        makeVoteTurnState([{ playerId: "p2", vote: TeamVote.Approve }]),
      );
      castTeamVoteAction.apply(game, { vote: TeamVote.Reject }, "p2");

      const ts = getTurnState(game);
      const phase = ts.phase as TeamVotePhase;
      expect(phase.votes).toHaveLength(1);
      expect(phase.votes[0]).toEqual({
        playerId: "p2",
        vote: TeamVote.Reject,
      });
    });

    it("preserves other players' votes when one player re-votes", () => {
      const game = makeGame(
        makeVoteTurnState([
          { playerId: "p2", vote: TeamVote.Approve },
          { playerId: "p3", vote: TeamVote.Reject },
        ]),
      );
      castTeamVoteAction.apply(game, { vote: TeamVote.Reject }, "p2");

      const ts = getTurnState(game);
      const phase = ts.phase as TeamVotePhase;
      expect(phase.votes).toHaveLength(2);
      expect(phase.votes.find((v) => v.playerId === "p3")?.vote).toBe(
        TeamVote.Reject,
      );
    });
  });
});
