import { describe, it, expect } from "vitest";
import { WerewolfPhase, type WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame, dayTurnState } from "./test-helpers";

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

describe("WerewolfAction.CastVote — isValid", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.CastVote];

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
    const game = makePlayingGame(makeDayStateWithTrial({ defendantId: "p2" }));
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
