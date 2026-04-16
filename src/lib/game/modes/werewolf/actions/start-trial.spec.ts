import { describe, it, expect } from "vitest";
import { GameMode } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState, WerewolfDaytimePhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame } from "./test-helpers";

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

describe("WerewolfAction.StartTrial — basic apply", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartTrial];

  it("starts trial with empty votes for non-Village-Idiot players", () => {
    const game = makePlayingGame(makeDayState());
    action.apply(game, { defendantId: "p1" }, "owner-1");
    const phase = (
      game.status as {
        turnState: {
          phase: { activeTrial: { votes: unknown[]; phase: string } };
        };
      }
    ).turnState.phase;
    expect(phase.activeTrial.votes).toHaveLength(0);
  });

  it("starts trial in defense phase", () => {
    const game = makePlayingGame(makeDayState());
    action.apply(game, { defendantId: "p1" }, "owner-1");
    const phase = (
      game.status as {
        turnState: {
          phase: { activeTrial: { phase: string } };
        };
      }
    ).turnState.phase;
    expect(phase.activeTrial.phase).toBe("defense");
  });

  it("auto-casts guilty vote for Village Idiot player", () => {
    const game = makePlayingGame(makeDayState(), {
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

  it("auto-casts innocent vote for Pacifist player", () => {
    const game = makePlayingGame(makeDayState(), {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Pacifist },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
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
      vote: "innocent",
    });
  });
});

describe("WerewolfAction.StartTrial — silenced, hypnotized, and auto-resolve", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartTrial];

  it("does not precast vote for silenced player", () => {
    const ts: WerewolfTurnState = {
      ...makeDayState(),
    };
    (ts.phase as WerewolfDaytimePhase).nightResolution = [
      { type: "silenced", targetPlayerId: "p2" },
    ];
    const game = makePlayingGame(ts, {
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
          phase: {
            activeTrial: { votes: { playerId: string }[] };
          };
        };
      }
    ).turnState.phase;
    expect(phase.activeTrial.votes.some((v) => v.playerId === "p2")).toBe(
      false,
    );
  });

  it("does not precast vote for hypnotized player", () => {
    const ts: WerewolfTurnState = makeDayState();
    (ts.phase as WerewolfDaytimePhase).nightResolution = [
      { type: "hypnotized", targetPlayerId: "p2", mummyPlayerId: "p4" },
    ];
    const game = makePlayingGame(ts, {
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
          phase: {
            activeTrial: { votes: { playerId: string }[] };
          };
        };
      }
    ).turnState.phase;
    expect(phase.activeTrial.votes.some((v) => v.playerId === "p2")).toBe(
      false,
    );
  });

  it("precast vote is applied when Mummy (who hypnotized player) has died", () => {
    const ts: WerewolfTurnState = {
      ...makeDayState(),
      deadPlayerIds: ["p4"],
    };
    (ts.phase as WerewolfDaytimePhase).nightResolution = [
      { type: "hypnotized", targetPlayerId: "p2", mummyPlayerId: "p4" },
    ];
    const game = makePlayingGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.VillageIdiot },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Mummy },
      ],
    });
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

  it("does not auto-resolve during defense even when all eligible players are Village Idiots", () => {
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
            activeTrial: {
              verdict?: string;
              phase: string;
              votes: unknown[];
            };
          };
        };
      }
    ).turnState.phase;
    expect(phase.activeTrial.phase).toBe("defense");
    expect(phase.activeTrial.verdict).toBeUndefined();
  });
});

describe("WerewolfAction.StartTrial — singleTrialPerDay", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartTrial];

  it("blocks starting a trial after one has concluded", () => {
    const ds = makeDayState();
    (ds.phase as WerewolfDaytimePhase).activeTrial = {
      defendantId: "p3",
      startedAt: 2000,
      phase: "voting",
      votes: [{ playerId: "p4", vote: "guilty" }],
      verdict: "eliminated",
    };
    const game = makePlayingGame(ds, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        singleTrialPerDay: true,
        revealProtections: true,
        hiddenRoleCount: 0,
      },
    });
    expect(action.isValid(game, "owner-1", { defendantId: "p4" })).toBe(false);
  });

  it("allows starting a trial after one has concluded when singleTrialPerDay is false", () => {
    const ds = makeDayState();
    (ds.phase as WerewolfDaytimePhase).activeTrial = {
      defendantId: "p3",
      startedAt: 2000,
      phase: "voting",
      votes: [{ playerId: "p4", vote: "guilty" }],
      verdict: "eliminated",
    };
    const game = makePlayingGame(ds, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        singleTrialPerDay: false,
        revealProtections: true,
        hiddenRoleCount: 0,
      },
    });
    expect(action.isValid(game, "owner-1", { defendantId: "p4" })).toBe(true);
  });
});
