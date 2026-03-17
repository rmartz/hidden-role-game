import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame, dayTurnState } from "./test-helpers";

// ---------------------------------------------------------------------------
// CastVote
// ---------------------------------------------------------------------------

function makeDayStateWithTrial(
  overrides: Partial<{
    defendantId: string;
    votes: { playerId: string; vote: "guilty" | "innocent" }[];
    deadPlayerIds: string[];
    verdict: "eliminated" | "innocent";
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
        votes: overrides.votes ?? [],
        ...(overrides.verdict ? { verdict: overrides.verdict } : {}),
      },
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
  };
}

describe("WerewolfAction.CastVote", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.CastVote];

  describe("isValid", () => {
    it("returns true for a valid guilty vote", () => {
      const game = makePlayingGame(makeDayStateWithTrial());
      expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(true);
    });

    it("returns true for a valid innocent vote", () => {
      const game = makePlayingGame(makeDayStateWithTrial());
      expect(action.isValid(game, "p2", { vote: "innocent" })).toBe(true);
    });

    it("returns false when called by owner", () => {
      const game = makePlayingGame(makeDayStateWithTrial());
      expect(action.isValid(game, "owner-1", { vote: "guilty" })).toBe(false);
    });

    it("returns false when not daytime", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(false);
    });

    it("returns false when no active trial", () => {
      const game = makePlayingGame({
        turn: 1,
        phase: {
          type: WerewolfPhase.Daytime,
          startedAt: 1000,
          nightActions: {},
        },
        deadPlayerIds: [],
      });
      expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(false);
    });

    it("returns false when verdict already set", () => {
      const game = makePlayingGame(
        makeDayStateWithTrial({ verdict: "eliminated" }),
      );
      expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(false);
    });

    it("returns false when caller is the defendant", () => {
      const game = makePlayingGame(
        makeDayStateWithTrial({ defendantId: "p2" }),
      );
      expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(false);
    });

    it("returns false when caller already voted", () => {
      const game = makePlayingGame(
        makeDayStateWithTrial({ votes: [{ playerId: "p2", vote: "guilty" }] }),
      );
      expect(action.isValid(game, "p2", { vote: "innocent" })).toBe(false);
    });

    it("returns false when caller is dead", () => {
      const game = makePlayingGame(
        makeDayStateWithTrial({ deadPlayerIds: ["p2"] }),
      );
      expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(false);
    });

    it("returns false for an invalid vote value", () => {
      const game = makePlayingGame(makeDayStateWithTrial());
      expect(action.isValid(game, "p2", { vote: "abstain" })).toBe(false);
    });

    describe("Village Idiot", () => {
      it("allows guilty vote", () => {
        const game = makePlayingGame(makeDayStateWithTrial(), {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.VillageIdiot },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          ],
        });
        expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(true);
      });

      it("rejects innocent vote", () => {
        const game = makePlayingGame(makeDayStateWithTrial(), {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.VillageIdiot },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          ],
        });
        expect(action.isValid(game, "p2", { vote: "innocent" })).toBe(false);
      });
    });
  });

  describe("apply", () => {
    it("records the vote", () => {
      const game = makePlayingGame(makeDayStateWithTrial());
      action.apply(game, { vote: "guilty" }, "p2");
      const phase = (
        game.status as {
          turnState: {
            phase: {
              activeTrial: { votes: { playerId: string; vote: string }[] };
            };
          };
        }
      ).turnState.phase;
      expect(phase.activeTrial.votes).toContainEqual({
        playerId: "p2",
        vote: "guilty",
      });
    });

    it("auto-resolves when all eligible players have voted", () => {
      // 3-player game: p1 is defendant, p2 and p3 are the only eligible voters
      const game = makePlayingGame(
        makeDayStateWithTrial({ defendantId: "p1", votes: [] }),
        {
          players: [
            { id: "p1", name: "Alice", sessionId: "s1", visibleRoles: [] },
            { id: "p2", name: "Bob", sessionId: "s2", visibleRoles: [] },
            { id: "p3", name: "Charlie", sessionId: "s3", visibleRoles: [] },
          ],
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, { vote: "guilty" }, "p2");
      action.apply(game, { vote: "innocent" }, "p3");
      const ts = (
        game.status as {
          turnState: { phase: { activeTrial: { verdict?: string } } };
        }
      ).turnState.phase;
      expect(ts.activeTrial.verdict).toBeDefined();
    });

    it("triggers Werewolves win when auto-resolve eliminates last non-Bad player", () => {
      // 3-player game: p1 (bad), p2 (good, defendant), p3 (good)
      // p1 already voted guilty; p3's vote is the last → auto-resolve eliminates p2
      // → 1 bad vs 1 good → Werewolves win
      const game = makePlayingGame(
        makeDayStateWithTrial({
          defendantId: "p2",
          votes: [{ playerId: "p1", vote: "guilty" }],
        }),
        {
          players: [
            { id: "p1", name: "Wolf", sessionId: "s1", visibleRoles: [] },
            { id: "p2", name: "Seer", sessionId: "s2", visibleRoles: [] },
            { id: "p3", name: "Villager", sessionId: "s3", visibleRoles: [] },
          ],
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, { vote: "guilty" }, "p3");
      expect(game.status.type).toBe(GameStatus.Finished);
    });
  });
});
