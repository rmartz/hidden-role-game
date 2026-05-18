import { describe, expect, it } from "vitest";

import { GameStatus } from "@/lib/types";

import { WerewolfRole } from "../roles";
import type { WerewolfTurnState } from "../types";
import { TrialPhase, TrialVerdict, WerewolfPhase } from "../types";
import { WerewolfWinner } from "../utils/win-condition";
import { WEREWOLF_ACTIONS, WerewolfAction } from "./index";
import { makePlayingGame } from "./test-helpers";

// ---------------------------------------------------------------------------
// UseMartyrAbility
// ---------------------------------------------------------------------------

function makeDayStateWithMartyrWindow(
  pendingGuiltId: string,
  deadPlayerIds: string[] = [],
  martyrUsed = false,
): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      activeTrial: {
        defendantId: pendingGuiltId,
        startedAt: 2000,
        phase: TrialPhase.Voting,
        verdict: TrialVerdict.Eliminated,
        votes: [],
      },
      pendingGuiltId,
    },
    deadPlayerIds,
    ...(martyrUsed && { roleState: { martyr: { abilityUsed: true } } }),
  };
}

function makeGameWithMartyr(
  ts: WerewolfTurnState,
  martyrPlayerId: string,
): ReturnType<typeof makePlayingGame> {
  return makePlayingGame(ts, {
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: martyrPlayerId, roleDefinitionId: WerewolfRole.Martyr },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
    ],
  });
}

describe("WerewolfAction.UseMartyrAbility", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.UseMartyrAbility];

  describe("isValid", () => {
    it("returns true for Martyr when pendingGuiltId is set for another player", () => {
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makeGameWithMartyr(ts, "p2");
      expect(action.isValid(game, "p2", {})).toBe(true);
    });

    it("returns true for narrator (owner) when Martyr is alive and pendingGuiltId is set for another player", () => {
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makeGameWithMartyr(ts, "p2");
      expect(action.isValid(game, "owner-1", {})).toBe(true);
    });

    it("returns false for narrator (owner) when Martyr has already used the ability", () => {
      const ts = makeDayStateWithMartyrWindow("p3", [], true);
      const game = makeGameWithMartyr(ts, "p2");
      expect(action.isValid(game, "owner-1", {})).toBe(false);
    });

    it("returns false for narrator (owner) when the Martyr is the convicted player", () => {
      const ts = makeDayStateWithMartyrWindow("p2");
      const game = makeGameWithMartyr(ts, "p2");
      expect(action.isValid(game, "owner-1", {})).toBe(false);
    });

    it("returns false when pendingGuiltId is not set", () => {
      const ts: WerewolfTurnState = {
        turn: 1,
        phase: {
          type: WerewolfPhase.Daytime,
          startedAt: 1000,
          nightActions: {},
        },
        deadPlayerIds: [],
      };
      const game = makeGameWithMartyr(ts, "p2");
      expect(action.isValid(game, "p2", {})).toBe(false);
    });

    it("returns false when Martyr ability already used", () => {
      const ts = makeDayStateWithMartyrWindow("p3", [], true);
      const game = makeGameWithMartyr(ts, "p2");
      expect(action.isValid(game, "p2", {})).toBe(false);
    });

    it("returns false when caller is not the Martyr", () => {
      const ts = makeDayStateWithMartyrWindow("p2");
      const game = makeGameWithMartyr(ts, "p3");
      expect(action.isValid(game, "p2", {})).toBe(false);
    });

    it("returns false when Martyr is already dead", () => {
      const ts = makeDayStateWithMartyrWindow("p3", ["p2"]);
      const game = makeGameWithMartyr(ts, "p2");
      expect(action.isValid(game, "p2", {})).toBe(false);
    });

    it("returns false when Martyr is the convicted player (cannot save themselves)", () => {
      const ts = makeDayStateWithMartyrWindow("p2");
      const game = makeGameWithMartyr(ts, "p2");
      expect(action.isValid(game, "p2", {})).toBe(false);
    });

    it("returns false for a non-Martyr player even if pendingGuiltId is set", () => {
      const ts = makeDayStateWithMartyrWindow("p2");
      const game = makeGameWithMartyr(ts, "p3");
      expect(action.isValid(game, "p4", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("adds the Martyr to deadPlayerIds", () => {
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makeGameWithMartyr(ts, "p2");
      action.apply(game, {}, "p2");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.deadPlayerIds).toContain("p2");
    });

    it("does not add the convicted player to deadPlayerIds", () => {
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makeGameWithMartyr(ts, "p2");
      action.apply(game, {}, "p2");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.deadPlayerIds).not.toContain("p3");
    });

    it("clears pendingGuiltId after Martyr intervenes", () => {
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makeGameWithMartyr(ts, "p2");
      action.apply(game, {}, "p2");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      const phase = result.phase as { pendingGuiltId?: string };
      expect(phase.pendingGuiltId).toBeUndefined();
    });

    it("sets martyrUsed to true", () => {
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makeGameWithMartyr(ts, "p2");
      action.apply(game, {}, "p2");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.roleState?.martyr?.abilityUsed).toBe(true);
    });

    it("convicted player survives with original role unchanged", () => {
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makeGameWithMartyr(ts, "p2");
      action.apply(game, {}, "p2");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.deadPlayerIds).not.toContain("p3");
      const role = game.roleAssignments.find(
        (a) => a.playerId === "p3",
      )?.roleDefinitionId;
      expect(role).toBe(WerewolfRole.Villager);
    });

    it("Martyr can only intervene once per game", () => {
      const ts = makeDayStateWithMartyrWindow("p3", [], true);
      const game = makeGameWithMartyr(ts, "p2");
      // martyrUsed is already true — isValid should return false
      expect(action.isValid(game, "p2", {})).toBe(false);
    });

    it("Martyr substituting for Tanner — Tanner survives, Tanner win does not fire", () => {
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makePlayingGame(ts, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Martyr },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Tanner },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "p2");
      // Game should not be finished — Tanner survived
      expect(game.status.type).toBe(GameStatus.Playing);
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.deadPlayerIds).toContain("p2");
      expect(result.deadPlayerIds).not.toContain("p3");
    });

    it("checks win condition after Martyr substitution", () => {
      // Martyr (p2) is Good; if last Good player dies, Werewolves win
      const ts = makeDayStateWithMartyrWindow("p3", ["p4", "p5"]);
      const game = makePlayingGame(ts, {
        players: [
          { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
          { id: "p2", name: "Martyr", sessionId: "s2", visiblePlayers: [] },
          { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
          { id: "p4", name: "Villager", sessionId: "s4", visiblePlayers: [] },
          { id: "p5", name: "Villager", sessionId: "s5", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Martyr },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "p2");
      // p4 and p5 are already dead, p2 (Martyr) dies; p1 (wolf) and p3 remain
      expect(game.status.type).toBe(GameStatus.Finished);
      expect((game.status as { winner?: string }).winner).toBe(
        WerewolfWinner.Werewolves,
      );
    });

    it("martyrUsed is carried forward day to night", () => {
      // Verify that start-night carries martyrUsed forward.
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makeGameWithMartyr(ts, "p2");
      action.apply(game, {}, "p2");
      // Now advance to night
      const startNight = WEREWOLF_ACTIONS[WerewolfAction.StartNight];
      startNight.apply(game, {}, "owner-1");
      const nightTs = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(nightTs.roleState?.martyr?.abilityUsed).toBe(true);
    });

    it("martyrUsed is carried forward night to day", () => {
      // Verify that start-day also carries martyrUsed forward (once-per-game
      // flag must survive a full day/night cycle).
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makeGameWithMartyr(ts, "p2");
      action.apply(game, {}, "p2");
      // Advance day -> night, then night -> day.
      const startNight = WEREWOLF_ACTIONS[WerewolfAction.StartNight];
      startNight.apply(game, {}, "owner-1");
      const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];
      startDay.apply(game, {}, "owner-1");
      const dayTs = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(dayTs.roleState?.martyr?.abilityUsed).toBe(true);
    });

    it("Executioner wins when Martyr is their target and Martyr self-sacrifices", () => {
      const ts: WerewolfTurnState = {
        ...makeDayStateWithMartyrWindow("p3"),
        roleState: { executioner: { targetId: "p2" } },
      };
      const game = makePlayingGame(ts, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Martyr },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Executioner },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "p2");
      expect(game.status.type).toBe(GameStatus.Finished);
      expect((game.status as { winner?: string }).winner).toBe(
        WerewolfWinner.Executioner,
      );
    });

    it("Mercenary co-wins with Executioner when Martyr is the Executioner's target and self-sacrifices", () => {
      const ts: WerewolfTurnState = {
        ...makeDayStateWithMartyrWindow("p3"),
        roleState: {
          executioner: { targetId: "p2" },
          mercenary: { charged: false, bribedPlayerIds: ["p4"] },
        },
      };
      const game = makePlayingGame(ts, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Martyr },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Executioner },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Mercenary },
        ],
      });
      action.apply(game, {}, "p2");
      expect(game.status.type).toBe(GameStatus.Finished);
      expect((game.status as { winner?: string }).winner).toBe(
        WerewolfWinner.Executioner,
      );
      expect(
        (game.status as { victoryConditionKey?: string }).victoryConditionKey,
      ).toBe(WerewolfWinner.Mercenary);
    });

    it("narrator (owner) acting on behalf of Martyr kills the Martyr, not the narrator", () => {
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makeGameWithMartyr(ts, "p2");
      action.apply(game, {}, "owner-1");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.deadPlayerIds).toContain("p2");
      expect(result.deadPlayerIds).not.toContain("owner-1");
      expect(result.deadPlayerIds).not.toContain("p3");
    });

    it("narrator apply with no Martyr in game is a no-op (does not kill narrator)", () => {
      // isValid would return false in this case, but we verify apply is safe
      // on its own too — no ?fallback that could kill the narrator.
      const ts = makeDayStateWithMartyrWindow("p3");
      const game = makePlayingGame(ts, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "owner-1");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.deadPlayerIds).not.toContain("owner-1");
      expect(result.phase).toMatchObject({ pendingGuiltId: "p3" });
    });

    it("Executioner does not win when they are dead when Martyr self-sacrifices", () => {
      const ts: WerewolfTurnState = {
        ...makeDayStateWithMartyrWindow("p3", ["p4"]),
        roleState: { executioner: { targetId: "p2" } },
      };
      const game = makePlayingGame(ts, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Martyr },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Executioner },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "p2");
      expect(game.status.type).toBe(GameStatus.Playing);
    });
  });
});
