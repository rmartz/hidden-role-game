import { describe, expect, it } from "vitest";

import type { Game } from "@/lib/types";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";

import { WerewolfRole } from "../../roles";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../../timer-config";
import { WEREWOLF_ACTIONS, WerewolfAction } from "../index";
import { makeNightState } from "../test-helpers";

const action = WEREWOLF_ACTIONS[WerewolfAction.ConfirmNightTarget];

function makeTavernKeeperGame(
  overrides: Partial<{
    nightActions: Record<string, unknown>;
    nightPhaseOrder: string[];
    currentPhaseIndex: number;
    deadPlayerIds: string[];
  }> = {},
) {
  const turnState = makeNightState({
    turn: 2,
    nightPhaseOrder: overrides.nightPhaseOrder ?? [
      WerewolfRole.TavernKeeper,
      WerewolfRole.Werewolf,
      WerewolfRole.Seer,
    ],
    currentPhaseIndex: overrides.currentPhaseIndex ?? 0,
    nightActions: (overrides.nightActions ?? {}) as Record<string, never>,
    deadPlayerIds: overrides.deadPlayerIds ?? [],
  });
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "tk1", name: "TK", sessionId: "stk1", visiblePlayers: [] },
      { id: "w1", name: "Wolf", sessionId: "sw1", visiblePlayers: [] },
      { id: "p3", name: "Seer", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "Villager", sessionId: "s4", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "tk1", roleDefinitionId: WerewolfRole.TavernKeeper },
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
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
  } as Game;
}

// ---------------------------------------------------------------------------
// ConfirmNightTarget — Tavern Keeper (retroactive-undo mechanic)
// ---------------------------------------------------------------------------

describe("ConfirmNightTarget — Tavern Keeper", () => {
  describe("isValid — TK confirm", () => {
    it("allows TK to confirm a target on turn 2+", () => {
      const game = makeTavernKeeperGame({
        nightActions: {
          [WerewolfRole.TavernKeeper]: { targetPlayerId: "p3" },
        },
      });
      expect(action.isValid(game, "tk1", undefined)).toBe(true);
    });

    it("requires TK to set a target before confirming", () => {
      const game = makeTavernKeeperGame();
      expect(action.isValid(game, "tk1", undefined)).toBe(false);
    });
  });

  describe("apply — TK confirm marks action as confirmed only", () => {
    it("sets confirmed on the TK action without storing roleState.tavernKeeper", () => {
      const game = makeTavernKeeperGame({
        nightActions: {
          [WerewolfRole.TavernKeeper]: { targetPlayerId: "p3" },
        },
      });
      action.apply(game, {}, "tk1");
      const ts = (
        game.status as {
          turnState: {
            phase: { nightActions: Record<string, { confirmed?: boolean }> };
            roleState?: { tavernKeeper?: unknown };
          };
        }
      ).turnState;
      expect(ts.phase.nightActions[WerewolfRole.TavernKeeper]?.confirmed).toBe(
        true,
      );
      expect(ts.roleState?.tavernKeeper).toBeUndefined();
    });

    it("does not remove the blocked player's phase from nightPhaseOrder", () => {
      const game = makeTavernKeeperGame({
        nightActions: {
          [WerewolfRole.TavernKeeper]: { targetPlayerId: "p3" },
        },
        nightPhaseOrder: [
          WerewolfRole.TavernKeeper,
          WerewolfRole.Werewolf,
          WerewolfRole.Seer,
        ],
      });
      action.apply(game, {}, "tk1");
      const ts = (
        game.status as { turnState: { phase: { nightPhaseOrder: string[] } } }
      ).turnState;
      // Seer phase is kept — the undo happens at resolution, not at confirm time
      expect(ts.phase.nightPhaseOrder).toContain(WerewolfRole.Seer);
      expect(ts.phase.nightPhaseOrder).toContain(WerewolfRole.Werewolf);
    });
  });

  describe("isValid — group phase confirm (no TK block filter)", () => {
    it("requires all alive group participants to have voted", () => {
      const game = {
        ...makeTavernKeeperGame({
          nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [{ playerId: "w2", targetPlayerId: "p3" }],
            },
          },
        }),
        players: [
          { id: "tk1", name: "TK", sessionId: "stk1", visiblePlayers: [] },
          {
            id: "w1",
            name: "Wolf1",
            sessionId: "sw1",
            visiblePlayers: [
              { playerId: "w2", reason: "wake-partner" as const },
            ],
          },
          {
            id: "w2",
            name: "Wolf2",
            sessionId: "sw2",
            visiblePlayers: [
              { playerId: "w1", reason: "wake-partner" as const },
            ],
          },
          { id: "p3", name: "Seer", sessionId: "s3", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "tk1", roleDefinitionId: WerewolfRole.TavernKeeper },
          { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
        ],
      };
      // w2 voted but w1 has not — requires both to agree now (no TK block filter)
      expect(action.isValid(game, "w2", undefined)).toBe(false);
    });

    it("allows group confirm when all alive participants have voted the same target", () => {
      const game = {
        ...makeTavernKeeperGame({
          nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [
                { playerId: "w1", targetPlayerId: "p3" },
                { playerId: "w2", targetPlayerId: "p3" },
              ],
            },
          },
        }),
        players: [
          { id: "tk1", name: "TK", sessionId: "stk1", visiblePlayers: [] },
          {
            id: "w1",
            name: "Wolf1",
            sessionId: "sw1",
            visiblePlayers: [
              { playerId: "w2", reason: "wake-partner" as const },
            ],
          },
          {
            id: "w2",
            name: "Wolf2",
            sessionId: "sw2",
            visiblePlayers: [
              { playerId: "w1", reason: "wake-partner" as const },
            ],
          },
          { id: "p3", name: "Seer", sessionId: "s3", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "tk1", roleDefinitionId: WerewolfRole.TavernKeeper },
          { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
        ],
      };
      expect(action.isValid(game, "w2", undefined)).toBe(true);
    });
  });
});
