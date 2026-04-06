import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { WerewolfPhase } from "../../types";
import type { WerewolfTurnState } from "../../types";
import { WerewolfRole } from "../../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../index";
import { makePlayingGame } from "../test-helpers";

function makeDayStateWithTrial(
  overrides: Partial<{
    defendantId: string;
    votes: { playerId: string; vote: "guilty" | "innocent" }[];
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
        phase: "voting" as const,
        votes: overrides.votes ?? [],
      },
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
  };
}

describe("WerewolfAction.CastVote — apply (basic)", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.CastVote];

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

  it("Mummy with no hypnotized target votes normally without side effects", () => {
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

  it("triggers Werewolves win when auto-resolve eliminates last non-Bad player", () => {
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
