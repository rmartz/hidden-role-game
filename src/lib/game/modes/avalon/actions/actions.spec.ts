import { describe, it, expect } from "vitest";
import {
  GameMode,
  GameStatus,
  ShowRolesInPlay,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { Game } from "@/lib/types";
import { AvalonPhase, TeamVote, QuestCard } from "../types";
import type { AvalonTurnState, TeamVotePhase, QuestPhase } from "../types";
import { AvalonRole } from "../roles";
import { proposeTeamAction } from "./propose-team";
import { castTeamVoteAction } from "./cast-team-vote";
import {
  resolveTeamVoteAction,
  advanceFromTeamVoteAction,
  tallyTeamVote,
} from "./resolve-team-vote";
import { playQuestCardAction } from "./play-quest-card";
import {
  resolveQuestAction,
  advanceFromQuestAction,
  tallyQuestCards,
} from "./resolve-quest";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const roleAssignments = [
  { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
  { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
  { playerId: "p3", roleDefinitionId: AvalonRole.LoyalServant },
  { playerId: "p4", roleDefinitionId: AvalonRole.MinionOfMordred },
  { playerId: "p5", roleDefinitionId: AvalonRole.Assassin },
];

const playerIds = roleAssignments.map((a) => a.playerId);

function makePlayers() {
  return playerIds.map((id) => ({
    id,
    name: `Player ${id}`,
    sessionId: `session-${id}`,
    visiblePlayers: [],
  }));
}

function makeGame(turnState: AvalonTurnState): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Avalon,
    status: { type: GameStatus.Playing, turnState },
    players: makePlayers(),
    roleAssignments,
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.Avalon },
  } satisfies Game;
}

function makeProposalTurnState(
  overrides: Partial<AvalonTurnState> = {},
): AvalonTurnState {
  return {
    questNumber: 1,
    phase: {
      type: AvalonPhase.TeamProposal,
      leaderId: "p1",
      teamSize: 2,
    },
    leaderOrder: [...playerIds],
    currentLeaderIndex: 0,
    questResults: [],
    consecutiveRejections: 0,
    questTeamSizes: [2, 3, 2, 3, 3],
    requiresTwoFails: [],
    ...overrides,
  };
}

function makeVoteTurnState(
  votes: { playerId: string; vote: TeamVote }[] = [],
  passed?: boolean,
): AvalonTurnState {
  const phase: TeamVotePhase = {
    type: AvalonPhase.TeamVote,
    leaderId: "p1",
    proposedTeam: ["p1", "p3"],
    votes,
    ...(passed !== undefined ? { passed } : {}),
  };
  return makeProposalTurnState({ phase });
}

function makeQuestTurnState(
  cards: { playerId: string; card: QuestCard }[] = [],
  failCount?: number,
): AvalonTurnState {
  const phase: QuestPhase = {
    type: AvalonPhase.Quest,
    leaderId: "p1",
    teamPlayerIds: ["p1", "p3"],
    cards,
    ...(failCount !== undefined ? { failCount } : {}),
  };
  return makeProposalTurnState({ phase });
}

function getTurnState(game: Game): AvalonTurnState {
  if (game.status.type !== GameStatus.Playing) throw new Error("Not playing");
  return game.status.turnState as AvalonTurnState;
}

// ---------------------------------------------------------------------------
// proposeTeamAction
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// castTeamVoteAction
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// resolveTeamVoteAction / tallyTeamVote / advanceFromTeamVote
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// playQuestCardAction
// ---------------------------------------------------------------------------

describe("playQuestCardAction", () => {
  describe("isValid", () => {
    it("team member can play Success", () => {
      const game = makeGame(makeQuestTurnState());
      expect(
        playQuestCardAction.isValid(game, "p1", { card: QuestCard.Success }),
      ).toBe(true);
    });

    it("Evil team member can play Fail", () => {
      // p4 is MinionOfMordred (Bad), but not on the quest team
      // Use p3 as team member (LoyalServant — but we need an evil player on team)
      // Make a game where p4 is on the quest team
      const questTs = makeProposalTurnState({
        phase: {
          type: AvalonPhase.Quest,
          leaderId: "p1",
          teamPlayerIds: ["p1", "p4"],
          cards: [],
        },
      });
      const game = makeGame(questTs);
      expect(
        playQuestCardAction.isValid(game, "p4", { card: QuestCard.Fail }),
      ).toBe(true);
    });

    it("Good-aligned player cannot play Fail", () => {
      const game = makeGame(makeQuestTurnState());
      // p1 is Merlin (Good)
      expect(
        playQuestCardAction.isValid(game, "p1", { card: QuestCard.Fail }),
      ).toBe(false);
    });

    it("non-team-member cannot play a card", () => {
      const game = makeGame(makeQuestTurnState());
      // p2 is not on the quest team (team is ["p1", "p3"])
      expect(
        playQuestCardAction.isValid(game, "p2", { card: QuestCard.Success }),
      ).toBe(false);
    });

    it("player cannot play a second card", () => {
      const game = makeGame(
        makeQuestTurnState([{ playerId: "p1", card: QuestCard.Success }]),
      );
      expect(
        playQuestCardAction.isValid(game, "p1", { card: QuestCard.Success }),
      ).toBe(false);
    });

    it("rejects invalid card value", () => {
      const game = makeGame(makeQuestTurnState());
      expect(playQuestCardAction.isValid(game, "p1", { card: "draw" })).toBe(
        false,
      );
    });

    it("rejects when quest is already resolved", () => {
      const game = makeGame(makeQuestTurnState([], 0));
      expect(
        playQuestCardAction.isValid(game, "p1", { card: QuestCard.Success }),
      ).toBe(false);
    });

    it("rejects when not in Quest phase", () => {
      const game = makeGame(makeVoteTurnState());
      expect(
        playQuestCardAction.isValid(game, "p1", { card: QuestCard.Success }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("adds card to the phase", () => {
      const game = makeGame(makeQuestTurnState());
      playQuestCardAction.apply(game, { card: QuestCard.Success }, "p1");

      const ts = getTurnState(game);
      const phase = ts.phase as QuestPhase;
      expect(phase.cards).toEqual([
        { playerId: "p1", card: QuestCard.Success },
      ]);
    });

    it("accumulates cards from multiple team members", () => {
      const game = makeGame(
        makeQuestTurnState([{ playerId: "p1", card: QuestCard.Success }]),
      );
      playQuestCardAction.apply(game, { card: QuestCard.Success }, "p3");

      const ts = getTurnState(game);
      const phase = ts.phase as QuestPhase;
      expect(phase.cards).toHaveLength(2);
    });
  });
});

// ---------------------------------------------------------------------------
// resolveQuestAction / tallyQuestCards / advanceFromQuest
// ---------------------------------------------------------------------------

describe("resolveQuestAction", () => {
  describe("isValid", () => {
    it("valid when all team members have played and quest not yet resolved", () => {
      const cards = [
        { playerId: "p1", card: QuestCard.Success },
        { playerId: "p3", card: QuestCard.Success },
      ];
      const game = makeGame(makeQuestTurnState(cards));
      expect(resolveQuestAction.isValid(game, "p1", {})).toBe(true);
    });

    it("invalid when not all team members have played", () => {
      const cards = [{ playerId: "p1", card: QuestCard.Success }];
      const game = makeGame(makeQuestTurnState(cards));
      expect(resolveQuestAction.isValid(game, "p1", {})).toBe(false);
    });

    it("invalid when quest is already resolved", () => {
      const cards = [
        { playerId: "p1", card: QuestCard.Success },
        { playerId: "p3", card: QuestCard.Success },
      ];
      const game = makeGame(makeQuestTurnState(cards, 0));
      expect(resolveQuestAction.isValid(game, "p1", {})).toBe(false);
    });

    it("invalid when not in Quest phase", () => {
      const game = makeGame(makeVoteTurnState());
      expect(resolveQuestAction.isValid(game, "p1", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("records zero fails for all-Success quest", () => {
      const cards = [
        { playerId: "p1", card: QuestCard.Success },
        { playerId: "p3", card: QuestCard.Success },
      ];
      const game = makeGame(makeQuestTurnState(cards));
      resolveQuestAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      const phase = ts.phase as QuestPhase;
      expect(phase.failCount).toBe(0);
      expect(phase.succeeded).toBe(true);
    });

    it("records one fail and marks quest failed", () => {
      // p4 is MinionOfMordred (Bad) and can play Fail
      const questTs = makeProposalTurnState({
        phase: {
          type: AvalonPhase.Quest,
          leaderId: "p1",
          teamPlayerIds: ["p1", "p4"],
          cards: [
            { playerId: "p1", card: QuestCard.Success },
            { playerId: "p4", card: QuestCard.Fail },
          ],
        },
      });
      const game = makeGame(questTs);
      resolveQuestAction.apply(game, {}, "p1");

      const ts = getTurnState(game);
      const phase = ts.phase as QuestPhase;
      expect(phase.failCount).toBe(1);
      expect(phase.succeeded).toBe(false);
    });
  });
});

describe("advanceFromQuestAction", () => {
  describe("isValid", () => {
    it("valid when quest has been resolved", () => {
      const cards = [
        { playerId: "p1", card: QuestCard.Success },
        { playerId: "p3", card: QuestCard.Success },
      ];
      const game = makeGame(makeQuestTurnState(cards, 0));
      expect(advanceFromQuestAction.isValid(game, "p1", {})).toBe(true);
    });

    it("invalid when quest has not been resolved", () => {
      const game = makeGame(makeQuestTurnState());
      expect(advanceFromQuestAction.isValid(game, "p1", {})).toBe(false);
    });
  });

  describe("apply - mid-game progression", () => {
    it("advances quest number and rotates leader after quest", () => {
      const ts = makeProposalTurnState({
        phase: {
          type: AvalonPhase.Quest,
          leaderId: "p1",
          teamPlayerIds: ["p1", "p3"],
          cards: [
            { playerId: "p1", card: QuestCard.Success },
            { playerId: "p3", card: QuestCard.Success },
          ],
          failCount: 0,
          succeeded: true,
        },
        questResults: [],
      });
      const game = makeGame(ts);
      advanceFromQuestAction.apply(game, {}, "p1");

      const newTs = getTurnState(game);
      expect(newTs.questNumber).toBe(2);
      expect(newTs.phase.type).toBe(AvalonPhase.TeamProposal);
      if (newTs.phase.type === AvalonPhase.TeamProposal) {
        expect(newTs.phase.leaderId).toBe("p2");
        expect(newTs.phase.teamSize).toBe(3); // quest 2 for 5 players is 3
      }
    });

    it("records quest result in questResults", () => {
      const ts = makeProposalTurnState({
        phase: {
          type: AvalonPhase.Quest,
          leaderId: "p1",
          teamPlayerIds: ["p1", "p3"],
          cards: [
            { playerId: "p1", card: QuestCard.Success },
            { playerId: "p3", card: QuestCard.Success },
          ],
          failCount: 0,
          succeeded: true,
        },
      });
      const game = makeGame(ts);
      advanceFromQuestAction.apply(game, {}, "p1");

      const newTs = getTurnState(game);
      expect(newTs.questResults).toHaveLength(1);
      expect(newTs.questResults[0]).toMatchObject({
        questNumber: 1,
        teamSize: 2,
        failCount: 0,
        succeeded: true,
      });
    });
  });

  describe("apply - Evil wins with 3 quest failures", () => {
    it("ends game with Bad winner after 3 Evil wins", () => {
      const ts = makeProposalTurnState({
        questNumber: 3,
        phase: {
          type: AvalonPhase.Quest,
          leaderId: "p1",
          teamPlayerIds: ["p4", "p5"],
          cards: [
            { playerId: "p4", card: QuestCard.Fail },
            { playerId: "p5", card: QuestCard.Fail },
          ],
          failCount: 2,
          succeeded: false,
        },
        questResults: [
          {
            questNumber: 1,
            teamSize: 2,
            teamPlayerIds: ["p4", "p5"],
            failCount: 1,
            succeeded: false,
          },
          {
            questNumber: 2,
            teamSize: 3,
            teamPlayerIds: ["p3", "p4", "p5"],
            failCount: 1,
            succeeded: false,
          },
        ],
      });
      const game = makeGame(ts);
      advanceFromQuestAction.apply(game, {}, "p1");

      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Bad");
        expect(game.status.victoryConditionKey).toBe("quests");
      }
    });
  });

  describe("apply - Good wins with 3 quest successes (with Assassin)", () => {
    it("transitions to Assassination phase when Good wins and Assassin exists", () => {
      const ts = makeProposalTurnState({
        questNumber: 3,
        phase: {
          type: AvalonPhase.Quest,
          leaderId: "p1",
          teamPlayerIds: ["p1", "p2"],
          cards: [
            { playerId: "p1", card: QuestCard.Success },
            { playerId: "p2", card: QuestCard.Success },
          ],
          failCount: 0,
          succeeded: true,
        },
        questResults: [
          {
            questNumber: 1,
            teamSize: 2,
            teamPlayerIds: ["p1", "p2"],
            failCount: 0,
            succeeded: true,
          },
          {
            questNumber: 2,
            teamSize: 3,
            teamPlayerIds: ["p1", "p2", "p3"],
            failCount: 0,
            succeeded: true,
          },
        ],
      });
      const game = makeGame(ts);
      advanceFromQuestAction.apply(game, {}, "p1");

      const newTs = getTurnState(game);
      expect(newTs.phase.type).toBe(AvalonPhase.Assassination);
      if (newTs.phase.type === AvalonPhase.Assassination) {
        // p5 is Assassin in roleAssignments
        expect(newTs.phase.assassinPlayerId).toBe("p5");
      }
    });
  });

  describe("apply - two-fail threshold", () => {
    it("quest with one Fail still succeeds when two fails required", () => {
      const ts = makeProposalTurnState({
        questNumber: 4,
        requiresTwoFails: [4],
        phase: {
          type: AvalonPhase.Quest,
          leaderId: "p1",
          teamPlayerIds: ["p1", "p2", "p3", "p4"],
          cards: [
            { playerId: "p1", card: QuestCard.Success },
            { playerId: "p2", card: QuestCard.Success },
            { playerId: "p3", card: QuestCard.Success },
            { playerId: "p4", card: QuestCard.Fail },
          ],
        },
        questTeamSizes: [2, 3, 2, 4, 4],
      });
      const game = makeGame(ts);
      // Tally manually
      tallyQuestCards(game);
      const questTs = getTurnState(game);
      const phase = questTs.phase as QuestPhase;
      expect(phase.failCount).toBe(1);
      expect(phase.succeeded).toBe(true);
    });

    it("quest with two Fails fails when two fails required", () => {
      const ts = makeProposalTurnState({
        questNumber: 4,
        requiresTwoFails: [4],
        phase: {
          type: AvalonPhase.Quest,
          leaderId: "p1",
          teamPlayerIds: ["p1", "p2", "p4", "p5"],
          cards: [
            { playerId: "p1", card: QuestCard.Success },
            { playerId: "p2", card: QuestCard.Success },
            { playerId: "p4", card: QuestCard.Fail },
            { playerId: "p5", card: QuestCard.Fail },
          ],
        },
        questTeamSizes: [2, 3, 2, 4, 4],
      });
      const game = makeGame(ts);
      tallyQuestCards(game);
      const questTs = getTurnState(game);
      const phase = questTs.phase as QuestPhase;
      expect(phase.failCount).toBe(2);
      expect(phase.succeeded).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// tallyTeamVote / advanceFromTeamVote (direct utility tests)
// ---------------------------------------------------------------------------

describe("tallyTeamVote", () => {
  it("is idempotent — does not re-tally after already resolved", () => {
    const game = makeGame(makeVoteTurnState([], true));
    tallyTeamVote(game);
    const ts = getTurnState(game);
    const phase = ts.phase as TeamVotePhase;
    expect(phase.passed).toBe(true);
  });
});
