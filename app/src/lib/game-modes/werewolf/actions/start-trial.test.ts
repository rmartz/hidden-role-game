import { describe, it, expect } from "vitest";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame } from "./test-helpers";

// ---------------------------------------------------------------------------
// StartTrial
// ---------------------------------------------------------------------------

function makeDayState(): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
    },
    deadPlayerIds: [],
  };
}

describe("WerewolfAction.StartTrial", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartTrial];

  describe("apply", () => {
    it("starts trial with empty votes for non-Village-Idiot players", () => {
      const game = makePlayingGame(makeDayState());
      action.apply(game, { defendantId: "p1" }, "owner-1");
      const phase = (
        game.status as {
          turnState: { phase: { activeTrial: { votes: unknown[] } } };
        }
      ).turnState.phase;
      expect(phase.activeTrial.votes).toHaveLength(0);
    });

    it("auto-casts guilty vote for Village Idiot player", () => {
      const game = makePlayingGame(makeDayState(), {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.VillageIdiot },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      // p1 is defendant; p2 (Village Idiot) should get auto-voted guilty
      action.apply(game, { defendantId: "p1" }, "owner-1");
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

    it("does not auto-cast vote for Village Idiot who is the defendant", () => {
      const game = makePlayingGame(makeDayState(), {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.VillageIdiot },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      // p2 (Village Idiot) is defendant — should not vote
      action.apply(game, { defendantId: "p2" }, "owner-1");
      const phase = (
        game.status as {
          turnState: {
            phase: { activeTrial: { votes: { playerId: string }[] } };
          };
        }
      ).turnState.phase;
      expect(phase.activeTrial.votes.some((v) => v.playerId === "p2")).toBe(
        false,
      );
    });

    it("does not auto-cast vote for dead Village Idiot", () => {
      const deadState: WerewolfTurnState = {
        ...makeDayState(),
        deadPlayerIds: ["p2"],
      };
      const game = makePlayingGame(deadState, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.VillageIdiot },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, { defendantId: "p1" }, "owner-1");
      const phase = (
        game.status as {
          turnState: {
            phase: { activeTrial: { votes: { playerId: string }[] } };
          };
        }
      ).turnState.phase;
      expect(phase.activeTrial.votes.some((v) => v.playerId === "p2")).toBe(
        false,
      );
    });

    it("auto-resolves when all eligible players are Village Idiots", () => {
      // 3-player game: p1 is defendant; p2 and p3 are both Village Idiots
      const game = makePlayingGame(makeDayState(), {
        players: [
          { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
          { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
          { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.VillageIdiot },
          { playerId: "p3", roleDefinitionId: WerewolfRole.VillageIdiot },
        ],
      });
      action.apply(game, { defendantId: "p1" }, "owner-1");
      const phase = (
        game.status as {
          turnState: {
            phase: {
              activeTrial: { verdict?: string; votes: unknown[] };
            };
          };
        }
      ).turnState.phase;
      expect(phase.activeTrial.verdict).toBe("eliminated");
    });
  });
});
