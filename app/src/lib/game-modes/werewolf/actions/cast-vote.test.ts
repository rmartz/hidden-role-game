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
        phase: "voting" as const,
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

    it("returns false during defense phase", () => {
      const ts: WerewolfTurnState = {
        turn: 1,
        phase: {
          type: WerewolfPhase.Daytime,
          startedAt: 1000,
          nightActions: {},
          activeTrial: {
            defendantId: "p1",
            startedAt: 2000,
            phase: "defense",
            votes: [],
          },
        },
        deadPlayerIds: [],
      };
      const game = makePlayingGame(ts);
      expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(false);
    });

    it("returns false for an invalid vote value", () => {
      const game = makePlayingGame(makeDayStateWithTrial());
      expect(action.isValid(game, "p2", { vote: "abstain" })).toBe(false);
    });

    it("returns false when caller is silenced", () => {
      const ts = makeDayStateWithTrial();
      (
        ts.phase as Extract<typeof ts.phase, { type: WerewolfPhase.Daytime }>
      ).nightResolution = [{ type: "silenced", targetPlayerId: "p2" }];
      const game = makePlayingGame(ts);
      expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(false);
    });

    it("returns false when caller is hypnotized", () => {
      const ts = makeDayStateWithTrial();
      (
        ts.phase as Extract<typeof ts.phase, { type: WerewolfPhase.Daytime }>
      ).nightResolution = [
        { type: "hypnotized", targetPlayerId: "p2", mummyPlayerId: "p3" },
      ];
      const game = makePlayingGame(ts);
      expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(false);
    });

    it("returns true when caller is hypnotized but Mummy has died", () => {
      const ts = makeDayStateWithTrial({ deadPlayerIds: ["p3"] });
      (
        ts.phase as Extract<typeof ts.phase, { type: WerewolfPhase.Daytime }>
      ).nightResolution = [
        { type: "hypnotized", targetPlayerId: "p2", mummyPlayerId: "p3" },
      ];
      const game = makePlayingGame(ts);
      expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(true);
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

    describe("Pacifist", () => {
      it("allows innocent vote", () => {
        const game = makePlayingGame(makeDayStateWithTrial(), {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Pacifist },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          ],
        });
        expect(action.isValid(game, "p2", { vote: "innocent" })).toBe(true);
      });

      it("rejects guilty vote", () => {
        const game = makePlayingGame(makeDayStateWithTrial(), {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Pacifist },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          ],
        });
        expect(action.isValid(game, "p2", { vote: "guilty" })).toBe(false);
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
            { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
            { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
            { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
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

    it("auto-casts hypnotized player vote when Mummy votes", () => {
      const ts = makeDayStateWithTrial({ defendantId: "p1" });
      (
        ts.phase as Extract<typeof ts.phase, { type: WerewolfPhase.Daytime }>
      ).nightResolution = [
        { type: "hypnotized", targetPlayerId: "p3", mummyPlayerId: "p2" },
      ];
      const game = makePlayingGame(ts, {
        players: [
          { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
          { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
          { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
          { id: "p4", name: "Dave", sessionId: "s4", visiblePlayers: [] },
          { id: "p5", name: "Eve", sessionId: "s5", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mummy },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
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
        playerId: "p3",
        vote: "guilty",
      });
    });

    it("Mummy with no hypnotized target votes normally without side effects", () => {
      // mummyHypnotizedId is absent — Mummy's vote should not auto-cast for anyone
      const ts = makeDayStateWithTrial({ defendantId: "p1" });
      const game = makePlayingGame(ts, {
        players: [
          { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
          { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
          { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mummy },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
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
      expect(phase.activeTrial.votes).toHaveLength(1);
      expect(phase.activeTrial.votes[0]).toEqual({
        playerId: "p2",
        vote: "guilty",
      });
    });

    it("formerly-hypnotized player can vote freely when Mummy has died", () => {
      // p4 (Mummy) hypnotized p3 but has since died — hypnosis is lifted, p3 may vote.
      // p5 (Villager) is the defendant so eliminating them doesn't end the game.
      const ts = makeDayStateWithTrial({
        defendantId: "p5",
        deadPlayerIds: ["p4"],
        votes: [{ playerId: "p1", vote: "guilty" }],
      });
      (
        ts.phase as Extract<typeof ts.phase, { type: WerewolfPhase.Daytime }>
      ).nightResolution = [
        { type: "hypnotized", targetPlayerId: "p3", mummyPlayerId: "p4" },
      ];
      const game = makePlayingGame(ts, {
        players: [
          { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
          { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
          { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
          { id: "p4", name: "Dave", sessionId: "s4", visiblePlayers: [] },
          { id: "p5", name: "Eve", sessionId: "s5", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Mummy },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, { vote: "guilty" }, "p2");
      action.apply(game, { vote: "guilty" }, "p3");
      const phase = (
        game.status as {
          turnState: { phase: { activeTrial: { verdict?: string } } };
        }
      ).turnState.phase;
      // p1 pre-voted; p2 and p3 are the last eligible voters (p4 dead, excluded) → auto-resolves
      expect(phase.activeTrial.verdict).toBe("eliminated");
    });

    it("Mayor double-vote tips a tie to guilty via auto-resolve", () => {
      // 5-player game: p3 (Villager) is defendant; eligible voters are p1, p2, p4, p5.
      // Pre-existing: p1=guilty, p4=innocent, p5=innocent (1 guilty vs 2 innocent).
      // Without Mayor: 2 guilty vs 2 innocent → tie → innocent.
      // Mayor (p2) votes guilty last → auto-resolves with Mayor bonus: 3 guilty vs 2 → eliminated.
      const game = makePlayingGame(
        makeDayStateWithTrial({
          defendantId: "p3",
          votes: [
            { playerId: "p1", vote: "guilty" },
            { playerId: "p4", vote: "innocent" },
            { playerId: "p5", vote: "innocent" },
          ],
        }),
        {
          players: [
            { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
            { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
            { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
            { id: "p4", name: "Dave", sessionId: "s4", visiblePlayers: [] },
            { id: "p5", name: "Eve", sessionId: "s5", visiblePlayers: [] },
          ],
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Mayor },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, { vote: "guilty" }, "p2");
      const phase = (
        game.status as {
          turnState: { phase: { activeTrial: { verdict?: string } } };
        }
      ).turnState.phase;
      expect(phase.activeTrial.verdict).toBe("eliminated");
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
      action.apply(game, { vote: "guilty" }, "p3");
      expect(game.status.type).toBe(GameStatus.Finished);
    });
  });
});
