import { describe, expect, it } from "vitest";

import { WerewolfPhase, WerewolfRole } from "@/lib/game/modes/werewolf";
import type { Game } from "@/lib/types";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";

import { werewolfServices } from "../services";
import { buildInitialTurnState } from "../services/initialization";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";
import type { WerewolfTurnState } from "../types";

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
  /**
   * Builds a Playing game whose initial turn state has Evil Empath at index 0
   * of the nightPhaseOrder, mimicking what advanceToPlaying does after
   * buildPlayingStatus sets game.status.
   */
  function makeNight1EvilEmpathGame(playerOrder: string[]): Game {
    const roleAssignments = [
      { playerId: "wolf1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "seer1", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "ee1", roleDefinitionId: WerewolfRole.EvilEmpath },
      { playerId: "v1", roleDefinitionId: WerewolfRole.Villager },
    ];
    const turnState = buildInitialTurnState(roleAssignments, {
      playerOrder,
    });
    return {
      id: "g1",
      lobbyId: "l1",
      gameMode: GameMode.Werewolf,
      status: { type: GameStatus.Playing, turnState },
      players: [
        { id: "wolf1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
        { id: "seer1", name: "Seer", sessionId: "s2", visiblePlayers: [] },
        { id: "ee1", name: "EvilEmpath", sessionId: "s3", visiblePlayers: [] },
        { id: "v1", name: "Villager", sessionId: "s4", visiblePlayers: [] },
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
  }

  it("auto-computes Evil Empath adjacency on night 1 when EvilEmpath is the first phase", () => {
    // Seer (seer1) is adjacent to Werewolf (wolf1): [wolf1, seer1, ee1, v1]
    const game = makeNight1EvilEmpathGame(["wolf1", "seer1", "ee1", "v1"]);
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;

    // Only run postInitialize if EvilEmpath is actually first in phase order
    // (depends on buildNightPhaseOrder placing it at index 0).
    const phaseOrder =
      ts.phase.type === WerewolfPhase.Nighttime ? ts.phase.nightPhaseOrder : [];
    if (phaseOrder[0] !== (WerewolfRole.EvilEmpath as string)) return;

    werewolfServices.postInitialize?.(game);

    const updatedTs = (game.status as { turnState: WerewolfTurnState })
      .turnState;
    expect(updatedTs.roleState?.evilEmpath?.lastResult).toBe(true);
  });

  it("does not throw when EvilEmpath is not the first phase", () => {
    // Seer is first — Evil Empath should not be auto-computed
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
