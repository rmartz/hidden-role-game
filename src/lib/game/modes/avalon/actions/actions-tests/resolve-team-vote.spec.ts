import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { AvalonPhase, TeamVote } from "../../types";
import type { TeamVotePhase, QuestPhase } from "../../types";
import {
  resolveTeamVoteAction,
  advanceFromTeamVoteAction,
  tallyTeamVote,
} from "../resolve-team-vote";
import {
  makeGame,
  makeProposalTurnState,
  makeVoteTurnState,
  getTurnState,
} from "./helpers";

describe("resolveTeamVoteAction", () => {
  describe("isValid", () => {
    it("valid when team vote has not been tallied", () => {
      const game = makeGame(makeVoteTurnState());
      expect(resolveTeamVoteAction.isValid(game, "p1", {})).toBe(true);
    });

    it("invalid after vote is already tallied", () => {
      const game = makeGame(makeVoteTurnState([], true));
      expect(resolveTeamVoteAction.isValid(game, "p1", {})).toBe(false);
    });

    it("invalid when not in TeamVote phase", () => {
      const game = makeGame(makeProposalTurnState());
      expect(resolveTeamVoteAction.isValid(game, "p1", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets passed=true when approvals strictly exceed rejections", () => {
      const votes = [
        { playerId: "p1", vote: TeamVote.Approve },
        { playerId: "p2", vote: TeamVote.Approve },
        { playerId: "p3", vote: TeamVote.Approve },
        { playerId: "p4", vote: TeamVote.Reject },
        { playerId: "p5", vote: TeamVote.Reject },
      ];
      const game = makeGame(makeVoteTurnState(votes));
      resolveTeamVoteAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      const phase = ts.phase as TeamVotePhase;
      expect(phase.passed).toBe(true);
    });

    it("sets passed=false when rejections equal approvals (tie)", () => {
      const votes = [
        { playerId: "p1", vote: TeamVote.Approve },
        { playerId: "p2", vote: TeamVote.Approve },
        { playerId: "p4", vote: TeamVote.Reject },
        { playerId: "p5", vote: TeamVote.Reject },
      ];
      const game = makeGame(makeVoteTurnState(votes));
      resolveTeamVoteAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      const phase = ts.phase as TeamVotePhase;
      expect(phase.passed).toBe(false);
    });

    it("sets passed=false when rejections exceed approvals", () => {
      const votes = [
        { playerId: "p1", vote: TeamVote.Approve },
        { playerId: "p2", vote: TeamVote.Reject },
        { playerId: "p3", vote: TeamVote.Reject },
        { playerId: "p4", vote: TeamVote.Reject },
        { playerId: "p5", vote: TeamVote.Reject },
      ];
      const game = makeGame(makeVoteTurnState(votes));
      resolveTeamVoteAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      const phase = ts.phase as TeamVotePhase;
      expect(phase.passed).toBe(false);
    });
  });
});

describe("advanceFromTeamVoteAction", () => {
  describe("isValid", () => {
    it("valid when vote is tallied", () => {
      const game = makeGame(makeVoteTurnState([], true));
      expect(advanceFromTeamVoteAction.isValid(game, "p1", {})).toBe(true);
    });

    it("invalid when vote has not yet been tallied", () => {
      const game = makeGame(makeVoteTurnState());
      expect(advanceFromTeamVoteAction.isValid(game, "p1", {})).toBe(false);
    });
  });

  describe("apply - vote passed", () => {
    it("transitions to Quest phase with team members", () => {
      const game = makeGame(makeVoteTurnState([], true));
      advanceFromTeamVoteAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(AvalonPhase.Quest);
      const phase = ts.phase as QuestPhase;
      expect(phase.teamPlayerIds).toEqual(["p1", "p3"]);
      expect(phase.cards).toEqual([]);
      expect(phase.leaderId).toBe("p1");
    });

    it("resets consecutiveRejections on approval", () => {
      const ts = makeVoteTurnState([], true);
      ts.consecutiveRejections = 3;
      const game = makeGame(ts);
      advanceFromTeamVoteAction.apply(game, {}, "p1");

      expect(getTurnState(game).consecutiveRejections).toBe(0);
    });
  });

  describe("apply - vote rejected", () => {
    it("increments consecutiveRejections", () => {
      const game = makeGame(makeVoteTurnState([], false));
      advanceFromTeamVoteAction.apply(game, {}, "p1");

      expect(getTurnState(game).consecutiveRejections).toBe(1);
    });

    it("rotates to next leader on rejection", () => {
      const game = makeGame(makeVoteTurnState([], false));
      advanceFromTeamVoteAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(AvalonPhase.TeamProposal);
      if (ts.phase.type === AvalonPhase.TeamProposal) {
        expect(ts.phase.leaderId).toBe("p2");
      }
    });

    it("returns to TeamProposal with same quest number", () => {
      const game = makeGame(makeVoteTurnState([], false));
      advanceFromTeamVoteAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      expect(ts.questNumber).toBe(1);
    });

    it("Evil wins after 5 consecutive rejections", () => {
      const ts = makeVoteTurnState([], false);
      ts.consecutiveRejections = 4;
      const game = makeGame(ts);
      advanceFromTeamVoteAction.apply(game, {}, "p1");

      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Bad");
        expect(game.status.victoryConditionKey).toBe("consecutive-rejections");
      }
    });
  });
});

describe("tallyTeamVote", () => {
  it("is idempotent — does not re-tally after already resolved", () => {
    const game = makeGame(makeVoteTurnState([], true));
    tallyTeamVote(game);
    const ts = getTurnState(game);
    const phase = ts.phase as TeamVotePhase;
    expect(phase.passed).toBe(true);
  });
});
