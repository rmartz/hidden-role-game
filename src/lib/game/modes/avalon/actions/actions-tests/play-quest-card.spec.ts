import { describe, it, expect } from "vitest";
import { AvalonPhase, QuestCard } from "../../types";
import type { QuestPhase } from "../../types";
import { playQuestCardAction } from "../play-quest-card";
import {
  makeGame,
  makeProposalTurnState,
  makeVoteTurnState,
  makeQuestTurnState,
  getTurnState,
} from "./helpers";

describe("playQuestCardAction", () => {
  describe("isValid", () => {
    it("team member can play Success", () => {
      const game = makeGame(makeQuestTurnState());
      expect(
        playQuestCardAction.isValid(game, "p1", { card: QuestCard.Success }),
      ).toBe(true);
    });

    it("Evil team member can play Fail", () => {
      // p4 is MinionOfMordred (Bad) on the quest team
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
