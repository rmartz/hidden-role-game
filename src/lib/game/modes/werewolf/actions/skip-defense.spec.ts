import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { WerewolfPhase, TrialVerdict, DaytimeVote, TrialPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame } from "./test-helpers";

function makeDayStateWithDefenseTrial(
  overrides: Partial<{
    defendantId: string;
    votes: { playerId: string; vote: DaytimeVote }[];
    deadPlayerIds: string[];
  }> = {},
): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      activeTrial: {
        defendantId: overrides.defendantId ?? "p1",
        startedAt: 2000,
        phase: TrialPhase.Defense,
        votes: overrides.votes ?? [],
      },
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
  };
}

describe("WerewolfAction.SkipDefense", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SkipDefense];

  describe("isValid", () => {
    it("returns true for narrator during defense phase", () => {
      const game = makePlayingGame(makeDayStateWithDefenseTrial());
      expect(action.isValid(game, "owner-1", {})).toBe(true);
    });

    it("returns false for non-narrator", () => {
      const game = makePlayingGame(makeDayStateWithDefenseTrial());
      expect(action.isValid(game, "p2", {})).toBe(false);
    });

    it("returns false during voting phase", () => {
      const ts: WerewolfTurnState = {
        turn: 1,
        phase: {
          type: WerewolfPhase.Daytime,
          startedAt: 1000,
          nightActions: {},
          activeTrial: {
            defendantId: "p1",
            startedAt: 2000,
            phase: TrialPhase.Voting,
            votes: [],
          },
        },
        deadPlayerIds: [],
      };
      const game = makePlayingGame(ts);
      expect(action.isValid(game, "owner-1", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("transitions trial to voting phase and sets voteStartedAt", () => {
      const game = makePlayingGame(makeDayStateWithDefenseTrial());
      action.apply(game, {}, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as Extract<
        WerewolfTurnState["phase"],
        { type: WerewolfPhase.Daytime }
      >;
      expect(phase.activeTrial?.phase).toBe(TrialPhase.Voting);
      expect(phase.activeTrial?.voteStartedAt).toBeTypeOf("number");
    });

    it("auto-resolves when precast votes cover all eligible voters", () => {
      // Use innocent votes so the verdict is TrialVerdict.Innocent and no win condition fires
      const game = makePlayingGame(
        makeDayStateWithDefenseTrial({
          defendantId: "p1",
          votes: [
            { playerId: "p2", vote: DaytimeVote.Innocent },
            { playerId: "p3", vote: DaytimeVote.Innocent },
            { playerId: "p4", vote: DaytimeVote.Innocent },
            { playerId: "p5", vote: DaytimeVote.Innocent },
          ],
        }),
      );
      action.apply(game, {}, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as Extract<
        WerewolfTurnState["phase"],
        { type: WerewolfPhase.Daytime }
      >;
      expect(phase.activeTrial?.verdict).toBe(TrialVerdict.Innocent);
    });

    it("triggers win condition when auto-resolve eliminates last non-Bad player", () => {
      const game = makePlayingGame(
        makeDayStateWithDefenseTrial({
          defendantId: "p2",
          votes: [
            { playerId: "p1", vote: DaytimeVote.Guilty },
            { playerId: "p3", vote: DaytimeVote.Guilty },
          ],
        }),
        {
          players: [
            { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
            { id: "p2", name: "Seer", sessionId: "s2", visiblePlayers: [] },
            { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
          ],
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Finished);
    });

    it("does not auto-resolve when votes do not cover all eligible", () => {
      const game = makePlayingGame(makeDayStateWithDefenseTrial());
      action.apply(game, {}, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as Extract<
        WerewolfTurnState["phase"],
        { type: WerewolfPhase.Daytime }
      >;
      expect(phase.activeTrial?.verdict).toBeUndefined();
    });
  });
});
