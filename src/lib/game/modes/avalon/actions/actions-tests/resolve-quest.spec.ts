import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { AvalonPhase, QuestCard } from "../../types";
import type { QuestPhase } from "../../types";
import {
  resolveQuestAction,
  advanceFromQuestAction,
  tallyQuestCards,
} from "../resolve-quest";
import {
  makeGame,
  makeProposalTurnState,
  makeVoteTurnState,
  makeQuestTurnState,
  getTurnState,
} from "./helpers";

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
