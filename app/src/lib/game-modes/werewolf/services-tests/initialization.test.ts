import { describe, it, expect } from "vitest";
import { WerewolfPhase, WerewolfRole } from "@/lib/game-modes/werewolf";
import { buildInitialTurnState } from "../services/initialization";

describe("buildInitialTurnState (Werewolf)", () => {
  it("returns a WerewolfTurnState", () => {
    const assignments = [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
    ];

    const result = buildInitialTurnState(assignments);

    expect(result).toBeDefined();
    expect(result.turn).toBe(1);
    expect(result.deadPlayerIds).toEqual([]);
    expect(result.phase.type).toBe(WerewolfPhase.Nighttime);
  });

  it("nightPhaseOrder is built from the role assignments", () => {
    const assignments = [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
    ];

    const result = buildInitialTurnState(assignments);

    expect(
      result.phase.type === WerewolfPhase.Nighttime &&
        result.phase.nightPhaseOrder.length,
    ).toBeGreaterThan(0);
  });
});
