import { describe, expect, it } from "vitest";

import type { Game } from "@/lib/types";
import { GameStatus } from "@/lib/types";

import { avalonServices } from "../services";
import type { AvalonTurnState } from "../types";
import { AvalonPhase, TeamVote } from "../types";
import { baseTurnState, makeGame, merlinRole, playerIds } from "./helpers";

describe("extractPlayerState — proposal and vote", () => {
  it("returns empty object when game is not playing", () => {
    const game = {
      ...makeGame(baseTurnState),
      status: { type: GameStatus.Starting as const },
    } satisfies Game;
    expect(avalonServices.extractPlayerState(game, "p1", merlinRole)).toEqual(
      {},
    );
  });

  it("all players see questResults, consecutiveRejections, and currentQuest", () => {
    const result = avalonServices.extractPlayerState(
      makeGame(baseTurnState),
      "p2",
      merlinRole,
    );
    expect(result["questResults"]).toEqual([]);
    expect(result["consecutiveRejections"]).toBe(0);
    expect(result["currentQuest"]).toEqual({
      questNumber: 1,
      teamSize: 2,
      requiresTwoFails: false,
    });
  });

  it("all players see avalonPhase with type and leaderId during TeamProposal", () => {
    const result = avalonServices.extractPlayerState(
      makeGame(baseTurnState),
      "p2",
      merlinRole,
    );
    expect(result["avalonPhase"]).toMatchObject({
      type: AvalonPhase.TeamProposal,
      leaderId: "p1",
      teamSize: 2,
    });
  });

  it("Quest Leader sees eligibleTeamMemberIds during TeamProposal", () => {
    const result = avalonServices.extractPlayerState(
      makeGame(baseTurnState),
      "p1",
      merlinRole,
    );
    expect(result["eligibleTeamMemberIds"]).toEqual(playerIds);
  });

  it("non-leader does not see eligibleTeamMemberIds during TeamProposal", () => {
    const result = avalonServices.extractPlayerState(
      makeGame(baseTurnState),
      "p2",
      merlinRole,
    );
    expect(result["eligibleTeamMemberIds"]).toBeUndefined();
  });

  it("proposed team visible during TeamProposal when set", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.TeamProposal,
        leaderId: "p1",
        teamSize: 2,
        proposedTeam: ["p1", "p3"],
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p2",
      merlinRole,
    );
    expect(result["proposedTeam"]).toEqual(["p1", "p3"]);
  });

  it("proposed team visible to all during TeamVote", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.TeamVote,
        leaderId: "p1",
        proposedTeam: ["p1", "p3"],
        votes: [],
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p2",
      merlinRole,
    );
    expect(result["proposedTeam"]).toEqual(["p1", "p3"]);
  });

  it("player sees their own vote during TeamVote", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.TeamVote,
        leaderId: "p1",
        proposedTeam: ["p1", "p3"],
        votes: [{ playerId: "p2", vote: TeamVote.Approve }],
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p2",
      merlinRole,
    );
    expect(result["myTeamVote"]).toBe(TeamVote.Approve);
  });

  it("all votes visible after TeamVote resolves", () => {
    const votes = [
      { playerId: "p1", vote: TeamVote.Approve },
      { playerId: "p2", vote: TeamVote.Reject },
    ];
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.TeamVote,
        leaderId: "p1",
        proposedTeam: ["p1", "p3"],
        votes,
        passed: true,
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p3",
      merlinRole,
    );
    expect(result["teamVotes"]).toEqual(votes);
    expect(result["teamVotePassed"]).toBe(true);
  });

  it("votes not visible before TeamVote resolves", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.TeamVote,
        leaderId: "p1",
        proposedTeam: ["p1", "p3"],
        votes: [{ playerId: "p1", vote: TeamVote.Approve }],
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p3",
      merlinRole,
    );
    expect(result["teamVotes"]).toBeUndefined();
    expect(result["teamVotePassed"]).toBeUndefined();
  });
});
