import { describe, expect, it } from "vitest";

import { WerewolfPhase, WerewolfRole } from "@/lib/game/modes/werewolf";
import type { Game } from "@/lib/types";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";

import { werewolfServices } from "../services";
import { buildInitialTurnState } from "../services/initialization";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";
import type { WerewolfNighttimePhase, WerewolfTurnState } from "../types";

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

// ---------------------------------------------------------------------------
// werewolfServices.postInitialize — Evil Empath auto-compute on night 1
// ---------------------------------------------------------------------------

describe("werewolfServices.postInitialize (Evil Empath night 1 auto-compute)", () => {
  it("auto-computes Evil Empath adjacency on night 1 when EvilEmpath is the first phase", () => {
    // Omit Werewolf from roleAssignments so EvilSupport (Evil Empath) is at
    // index 0 of nightPhaseOrder — a Villager is overridden to Werewolf via
    // roleOverrides so the adjacency check still produces a meaningful result.
    // playerOrder: [ee1, seer1, v1, v2] — v1 is adjacent to seer1 (right neighbour)
    const playerOrder = ["ee1", "seer1", "v1", "v2"];
    const roleAssignments = [
      { playerId: "ee1", roleDefinitionId: WerewolfRole.EvilEmpath },
      { playerId: "seer1", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "v1", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "v2", roleDefinitionId: WerewolfRole.Villager },
    ];
    const turnState = buildInitialTurnState(roleAssignments, {
      playerOrder,
    });

    // Override v1 (adjacent to seer1) to Werewolf so adjacency = true
    turnState.roleOverrides = { v1: WerewolfRole.Werewolf };

    const game: Game = {
      id: "g1",
      lobbyId: "l1",
      gameMode: GameMode.Werewolf,
      status: { type: GameStatus.Playing, turnState },
      players: [
        { id: "ee1", name: "EvilEmpath", sessionId: "s1", visiblePlayers: [] },
        { id: "seer1", name: "Seer", sessionId: "s2", visiblePlayers: [] },
        { id: "v1", name: "V1", sessionId: "s3", visiblePlayers: [] },
        { id: "v2", name: "V2", sessionId: "s4", visiblePlayers: [] },
      ],
      roleAssignments,
      configuredRoleBuckets: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: "owner1",
      playerOrder,
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        trialsPerDay: 1,
        revealProtections: true,
        hiddenRoleCount: 0,
        showRolesOnDeath: true,
        autoRevealNightOutcome: true,
      },
      timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    };

    // Verify that EvilEmpath is actually at index 0 (no EvilKilling roles present)
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.phase.type).toBe(WerewolfPhase.Nighttime);
    expect((ts.phase as WerewolfNighttimePhase).nightPhaseOrder[0]).toBe(
      WerewolfRole.EvilEmpath,
    );
    werewolfServices.postInitialize?.(game);

    const updatedTs = (game.status as { turnState: WerewolfTurnState })
      .turnState;
    // v1 (adjacent to seer1) is overridden to Werewolf → adjacency = true
    expect(updatedTs.roleState?.evilEmpath?.lastResult).toBe(true);
  });

  it("does not throw when EvilEmpath is not the first phase", () => {
    // Werewolf is first — Evil Empath should not be auto-computed
    const roleAssignments = [
      { playerId: "wolf1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "seer1", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "v1", roleDefinitionId: WerewolfRole.Villager },
    ];
    const turnState = buildInitialTurnState(roleAssignments);
    const game: Game = {
      id: "g1",
      lobbyId: "l1",
      gameMode: GameMode.Werewolf,
      status: { type: GameStatus.Playing, turnState },
      players: [
        { id: "wolf1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
        { id: "seer1", name: "Seer", sessionId: "s2", visiblePlayers: [] },
        { id: "v1", name: "Villager", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments,
      configuredRoleBuckets: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: "owner1",
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        trialsPerDay: 1,
        revealProtections: true,
        hiddenRoleCount: 0,
        showRolesOnDeath: true,
        autoRevealNightOutcome: true,
      },
      timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    };

    // Should not throw; EvilEmpath is not in the roster so is not the first phase
    expect(() => werewolfServices.postInitialize?.(game)).not.toThrow();

    const updatedTs = (game.status as { turnState: WerewolfTurnState })
      .turnState;
    expect(updatedTs.roleState?.evilEmpath?.lastResult).toBeUndefined();
  });
});
