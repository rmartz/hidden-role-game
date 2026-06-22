import { describe, expect, it } from "vitest";

import { AvalonRole } from "../roles";
import { avalonServices } from "../services";
import type { AvalonTurnState } from "../types";
import { AvalonPhase } from "../types";
import { assignments } from "./helpers";

describe("buildInitialTurnState", () => {
  it("starts at quest 1 with TeamProposal phase", () => {
    const ts = avalonServices.buildInitialTurnState(
      assignments,
    ) as AvalonTurnState;
    expect(ts.questNumber).toBe(1);
    expect(ts.phase.type).toBe(AvalonPhase.TeamProposal);
  });

  it("sets correct team sizes for 5 players", () => {
    const ts = avalonServices.buildInitialTurnState(
      assignments,
    ) as AvalonTurnState;
    expect(ts.questTeamSizes).toEqual([2, 3, 2, 3, 3]);
  });

  it("sets correct team sizes for 7 players", () => {
    const sevenAssignments = [
      { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
      { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p3", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p4", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p5", roleDefinitionId: AvalonRole.MinionOfMordred },
      { playerId: "p6", roleDefinitionId: AvalonRole.MinionOfMordred },
      { playerId: "p7", roleDefinitionId: AvalonRole.Assassin },
    ];
    const ts = avalonServices.buildInitialTurnState(
      sevenAssignments,
    ) as AvalonTurnState;
    expect(ts.questTeamSizes).toEqual([2, 3, 3, 4, 4]);
  });

  it("does not require two fails for 5 players", () => {
    const ts = avalonServices.buildInitialTurnState(
      assignments,
    ) as AvalonTurnState;
    expect(ts.requiresTwoFails).toEqual([]);
  });

  it("requires two fails on quest 4 for 7+ players", () => {
    const sevenAssignments = [
      { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
      { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p3", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p4", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p5", roleDefinitionId: AvalonRole.MinionOfMordred },
      { playerId: "p6", roleDefinitionId: AvalonRole.MinionOfMordred },
      { playerId: "p7", roleDefinitionId: AvalonRole.Assassin },
    ];
    const ts = avalonServices.buildInitialTurnState(
      sevenAssignments,
    ) as AvalonTurnState;
    expect(ts.requiresTwoFails).toEqual([4]);
  });

  it("preserves playerOrder as leader rotation when provided", () => {
    const specifiedOrder = ["p5", "p3", "p1", "p4", "p2"];
    const ts = avalonServices.buildInitialTurnState(assignments, {
      playerOrder: specifiedOrder,
    }) as AvalonTurnState;
    expect(ts.leaderOrder).toEqual(specifiedOrder);
  });

  it("first leader matches first player in leaderOrder", () => {
    const specifiedOrder = ["p3", "p1", "p2", "p5", "p4"];
    const ts = avalonServices.buildInitialTurnState(assignments, {
      playerOrder: specifiedOrder,
    }) as AvalonTurnState;
    expect(ts.phase.type).toBe(AvalonPhase.TeamProposal);
    if (ts.phase.type === AvalonPhase.TeamProposal) {
      expect(ts.phase.leaderId).toBe("p3");
    }
  });

  it("shuffles players when no playerOrder is provided", () => {
    const results = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const ts = avalonServices.buildInitialTurnState(
        assignments,
      ) as AvalonTurnState;
      results.add(ts.leaderOrder.join(","));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("throws for unsupported player count", () => {
    const fourAssignments = [
      { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
      { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p3", roleDefinitionId: AvalonRole.MinionOfMordred },
      { playerId: "p4", roleDefinitionId: AvalonRole.Assassin },
    ];
    expect(() => avalonServices.buildInitialTurnState(fourAssignments)).toThrow(
      "No quest configuration for 4 players",
    );
  });

  it("initializes consecutiveRejections and questResults to 0 and empty", () => {
    const ts = avalonServices.buildInitialTurnState(
      assignments,
    ) as AvalonTurnState;
    expect(ts.consecutiveRejections).toBe(0);
    expect(ts.questResults).toEqual([]);
  });
});
