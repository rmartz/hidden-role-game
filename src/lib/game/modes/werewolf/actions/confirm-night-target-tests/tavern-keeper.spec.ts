import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../index";
import { makeNightState } from "../test-helpers";
import type { Game } from "@/lib/types";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../../timer-config";

const action = WEREWOLF_ACTIONS[WerewolfAction.ConfirmNightTarget];

function makeTavernKeeperGame(
  overrides: Partial<{
    nightActions: Record<string, unknown>;
    nightPhaseOrder: string[];
    currentPhaseIndex: number;
    deadPlayerIds: string[];
    tavernKeeperBlockedPlayerId: string;
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
  if (overrides.tavernKeeperBlockedPlayerId) {
    turnState.tavernKeeperBlockedPlayerId =
      overrides.tavernKeeperBlockedPlayerId;
  }
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
// ConfirmNightTarget — Tavern Keeper block logic
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

  describe("apply — TK confirm stores blocked player ID", () => {
    it("sets tavernKeeperBlockedPlayerId on confirm", () => {
      const game = makeTavernKeeperGame({
        nightActions: {
          [WerewolfRole.TavernKeeper]: { targetPlayerId: "p3" },
        },
      });
      action.apply(game, {}, "tk1");
      const ts = (
        game.status as { turnState: { tavernKeeperBlockedPlayerId?: string } }
      ).turnState;
      expect(ts.tavernKeeperBlockedPlayerId).toBe("p3");
    });

    it("removes the blocked solo role's phase from nightPhaseOrder", () => {
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
      expect(ts.phase.nightPhaseOrder).not.toContain(WerewolfRole.Seer);
      expect(ts.phase.nightPhaseOrder).toContain(WerewolfRole.Werewolf);
    });

    it("keeps the werewolf group phase when multiple wolves are alive", () => {
      const game = {
        ...makeTavernKeeperGame({
          nightActions: {
            [WerewolfRole.TavernKeeper]: { targetPlayerId: "w1" },
          },
          nightPhaseOrder: [
            WerewolfRole.TavernKeeper,
            WerewolfRole.Werewolf,
            WerewolfRole.Seer,
          ],
        }),
        players: [
          { id: "tk1", name: "TK", sessionId: "stk1", visiblePlayers: [] },
          { id: "w1", name: "Wolf1", sessionId: "sw1", visiblePlayers: [] },
          { id: "w2", name: "Wolf2", sessionId: "sw2", visiblePlayers: [] },
          { id: "p3", name: "Seer", sessionId: "s3", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "tk1", roleDefinitionId: WerewolfRole.TavernKeeper },
          { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
        ],
      };
      action.apply(game, {}, "tk1");
      const ts = (
        game.status as { turnState: { phase: { nightPhaseOrder: string[] } } }
      ).turnState;
      // Wolf phase is kept because w2 is still alive and unblocked
      expect(ts.phase.nightPhaseOrder).toContain(WerewolfRole.Werewolf);
    });

    it("removes the werewolf group phase when the lone wolf is blocked", () => {
      // Only one wolf — blocking them removes the wolf phase entirely
      const game = makeTavernKeeperGame({
        nightActions: {
          [WerewolfRole.TavernKeeper]: { targetPlayerId: "w1" },
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
      expect(ts.phase.nightPhaseOrder).not.toContain(WerewolfRole.Werewolf);
    });
  });

  describe("isValid — group phase with blocked participant", () => {
    it("allows group phase confirm when only unblocked wolves have voted", () => {
      const game = {
        ...makeTavernKeeperGame({
          nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [{ playerId: "w2", targetPlayerId: "p3" }],
            },
          },
          tavernKeeperBlockedPlayerId: "w1",
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
      // w2 (unblocked) has voted — should be valid to confirm
      expect(action.isValid(game, "w2", undefined)).toBe(true);
    });

    it("rejects group confirm when the only unblocked wolf has not voted", () => {
      const game = {
        ...makeTavernKeeperGame({
          nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
          currentPhaseIndex: 0,
          nightActions: {},
          tavernKeeperBlockedPlayerId: "w1",
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
      expect(action.isValid(game, "w2", undefined)).toBe(false);
    });
  });
});
