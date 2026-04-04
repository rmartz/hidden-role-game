import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { WerewolfWinner } from "../utils/win-condition";
import { makePlayingGame } from "./test-helpers";

// ---------------------------------------------------------------------------
// ResolveHunterRevenge
// ---------------------------------------------------------------------------

function makeDayWithHunterRevenge(): WerewolfTurnState {
  return {
    turn: 2,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
    },
    deadPlayerIds: ["p2"],
    hunterRevengePlayerId: "p2",
  };
}

describe("WerewolfAction.ResolveHunterRevenge", () => {
  const resolveRevenge = WEREWOLF_ACTIONS[WerewolfAction.ResolveHunterRevenge];

  it("isValid returns true when hunterRevengePlayerId is set and target is alive", () => {
    const game = makePlayingGame(makeDayWithHunterRevenge(), {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    expect(
      resolveRevenge.isValid(game, "owner-1", { targetPlayerId: "p3" }),
    ).toBe(true);
  });

  it("isValid returns false when targeting a dead player", () => {
    const game = makePlayingGame(makeDayWithHunterRevenge(), {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    // p2 is already dead
    expect(
      resolveRevenge.isValid(game, "owner-1", { targetPlayerId: "p2" }),
    ).toBe(false);
  });

  it("kills target, clears hunterRevengePlayerId, and checks win condition", () => {
    const game = makePlayingGame(makeDayWithHunterRevenge(), {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    resolveRevenge.apply(game, { targetPlayerId: "p3" }, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p3");
    expect(ts.hunterRevengePlayerId).toBeUndefined();
  });

  it("Hunter revenge on the last wolf triggers Village win", () => {
    const game = makePlayingGame(makeDayWithHunterRevenge(), {
      players: [
        { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Hunter", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    resolveRevenge.apply(game, { targetPlayerId: "p1" }, "owner-1");
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner?: string }).winner).toBe(
      WerewolfWinner.Village,
    );
  });
});
