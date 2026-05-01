import { describe, it, expect } from "vitest";
import { AvalonPhase } from "../../types";
import type { TeamVotePhase } from "../../types";
import { proposeTeamAction } from "../propose-team";
import {
  makeGame,
  makeProposalTurnState,
  makeVoteTurnState,
  getTurnState,
} from "./helpers";

describe("proposeTeamAction", () => {
  describe("isValid", () => {
    it("leader can propose a valid team", () => {
      const game = makeGame(makeProposalTurnState());
      expect(
        proposeTeamAction.isValid(game, "p1", { teamPlayerIds: ["p2", "p3"] }),
      ).toBe(true);
    });

    it("non-leader cannot propose a team", () => {
      const game = makeGame(makeProposalTurnState());
      expect(
        proposeTeamAction.isValid(game, "p2", { teamPlayerIds: ["p2", "p3"] }),
      ).toBe(false);
    });

    it("rejects team smaller than required size", () => {
      const game = makeGame(makeProposalTurnState());
      expect(
        proposeTeamAction.isValid(game, "p1", { teamPlayerIds: ["p2"] }),
      ).toBe(false);
    });

    it("rejects team larger than required size", () => {
      const game = makeGame(makeProposalTurnState());
      expect(
        proposeTeamAction.isValid(game, "p1", {
          teamPlayerIds: ["p1", "p2", "p3"],
        }),
      ).toBe(false);
    });

    it("rejects duplicate player IDs", () => {
      const game = makeGame(makeProposalTurnState());
      expect(
        proposeTeamAction.isValid(game, "p1", { teamPlayerIds: ["p1", "p1"] }),
      ).toBe(false);
    });

    it("rejects unknown player IDs", () => {
      const game = makeGame(makeProposalTurnState());
      expect(
        proposeTeamAction.isValid(game, "p1", {
          teamPlayerIds: ["p1", "unknown"],
        }),
      ).toBe(false);
    });

    it("rejects when not in TeamProposal phase", () => {
      const game = makeGame(
        makeProposalTurnState({ phase: makeVoteTurnState().phase }),
      );
      expect(
        proposeTeamAction.isValid(game, "p1", { teamPlayerIds: ["p1", "p2"] }),
      ).toBe(false);
    });

    it("rejects non-array teamPlayerIds", () => {
      const game = makeGame(makeProposalTurnState());
      expect(
        proposeTeamAction.isValid(game, "p1", { teamPlayerIds: "p1,p2" }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("transitions to TeamVote phase with the proposed team", () => {
      const game = makeGame(makeProposalTurnState());
      proposeTeamAction.apply(game, { teamPlayerIds: ["p2", "p3"] }, "p1");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(AvalonPhase.TeamVote);
      const phase = ts.phase as TeamVotePhase;
      expect(phase.proposedTeam).toEqual(["p2", "p3"]);
      expect(phase.votes).toEqual([]);
      expect(phase.leaderId).toBe("p1");
    });
  });
});
