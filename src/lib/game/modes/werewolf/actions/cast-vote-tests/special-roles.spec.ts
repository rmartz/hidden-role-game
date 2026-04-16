import { describe, it, expect } from "vitest";
import {
  WerewolfPhase,
  TrialVerdict,
  DaytimeVote,
  TrialPhase,
} from "../../types";
import type { WerewolfTurnState } from "../../types";
import { WerewolfRole } from "../../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../index";
import { makePlayingGame } from "../test-helpers";

function makeDayStateWithTrial(
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
        phase: TrialPhase.Voting,
        votes: overrides.votes ?? [],
      },
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
  };
}

describe("WerewolfAction.CastVote — apply (Mummy, hypnotized, Mayor)", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.CastVote];

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
    action.apply(game, { vote: DaytimeVote.Guilty }, "p2");
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
      vote: DaytimeVote.Guilty,
    });
  });

  it("formerly-hypnotized player can vote freely when Mummy has died", () => {
    const ts = makeDayStateWithTrial({
      defendantId: "p5",
      deadPlayerIds: ["p4"],
      votes: [{ playerId: "p1", vote: DaytimeVote.Guilty }],
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
    action.apply(game, { vote: DaytimeVote.Guilty }, "p2");
    action.apply(game, { vote: DaytimeVote.Guilty }, "p3");
    const phase = (
      game.status as {
        turnState: { phase: { activeTrial: { verdict?: string } } };
      }
    ).turnState.phase;
    expect(phase.activeTrial.verdict).toBe(TrialVerdict.Eliminated);
  });

  it("Mayor double-vote tips a tie to guilty via auto-resolve", () => {
    const game = makePlayingGame(
      makeDayStateWithTrial({
        defendantId: "p3",
        votes: [
          { playerId: "p1", vote: DaytimeVote.Guilty },
          { playerId: "p4", vote: DaytimeVote.Innocent },
          { playerId: "p5", vote: DaytimeVote.Innocent },
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
    action.apply(game, { vote: DaytimeVote.Guilty }, "p2");
    const phase = (
      game.status as {
        turnState: { phase: { activeTrial: { verdict?: string } } };
      }
    ).turnState.phase;
    expect(phase.activeTrial.verdict).toBe(TrialVerdict.Eliminated);
  });
});
