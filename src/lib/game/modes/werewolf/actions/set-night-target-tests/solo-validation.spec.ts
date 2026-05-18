import { describe, expect, it } from "vitest";

import { WerewolfRole } from "../../roles";
import type { WerewolfTurnState } from "../../types";
import { WEREWOLF_ACTIONS, WerewolfAction } from "../index";
import {
  dayTurnState,
  makeNightState,
  makePlayingGame,
  nightTurn2State,
  nightTurnState,
} from "../test-helpers";

// ---------------------------------------------------------------------------
// SetNightTarget — solo role validation
// ---------------------------------------------------------------------------

describe("WerewolfAction.SetNightTarget", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  describe("isValid — owner", () => {
    it("allows owner to set a target with explicit roleId on turn 2+", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(
        action.isValid(game, "owner-1", {
          roleId: WerewolfRole.Seer,
          targetPlayerId: "p1",
        }),
      ).toBe(true);
    });

    it("blocks owner from setting Illusion Artist self-target", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.IllusionArtist],
          currentPhaseIndex: 0,
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.IllusionArtist },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Werewolf },
          ],
        },
      );

      expect(
        action.isValid(game, "owner-1", {
          roleId: WerewolfRole.IllusionArtist,
          targetPlayerId: "p1",
        }),
      ).toBe(false);
    });

    it("blocks owner from setting self-target when role is active via roleOverrides", () => {
      const turnState = makeNightState({
        turn: 2,
        nightPhaseOrder: [WerewolfRole.IllusionArtist],
        currentPhaseIndex: 0,
      });
      turnState.roleOverrides = { p1: WerewolfRole.IllusionArtist };
      const game = makePlayingGame(turnState, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.VillageDrunk },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Werewolf },
        ],
      });

      expect(
        action.isValid(game, "owner-1", {
          roleId: WerewolfRole.IllusionArtist,
          targetPlayerId: "p1",
        }),
      ).toBe(false);
    });
  });

  describe("isValid — player (solo role)", () => {
    it("returns true when active player targets a valid player on turn 2+", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(true);
    });

    it("returns true when active player clears target (undefined targetPlayerId)", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p1", { targetPlayerId: undefined })).toBe(
        true,
      );
    });

    it("returns false on first turn", () => {
      const game = makePlayingGame(nightTurnState);
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(false);
    });

    it("returns false when caller is not the active role", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p2", { targetPlayerId: "p1" })).toBe(false);
    });

    it("returns false when targeting the game owner", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p1", { targetPlayerId: "owner-1" })).toBe(
        false,
      );
    });

    it("returns false when targeting a non-existent player", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p1", { targetPlayerId: "unknown" })).toBe(
        false,
      );
    });

    it("returns false when targeting a dead player", () => {
      const game = makePlayingGame(
        makeNightState({ turn: 2, deadPlayerIds: ["p2"] }),
      );
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(false);
    });

    it("returns false during daytime", () => {
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(false);
    });

    it("returns false when targetPlayerId is not a string", () => {
      const game = makePlayingGame(nightTurn2State);
      expect(action.isValid(game, "p1", { targetPlayerId: 123 })).toBe(false);
    });

    it("returns false when caller has no role assignment", () => {
      const game = makePlayingGame(nightTurn2State, { roleAssignments: [] });
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(false);
    });

    it("returns false when player's target is already confirmed", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: {
              targetPlayerId: "p2",
              confirmed: true,
            },
          },
        }),
      );
      expect(action.isValid(game, "p1", { targetPlayerId: "p3" })).toBe(false);
    });

    it("allows owner to override a confirmed target", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: {
              targetPlayerId: "p2",
              confirmed: true,
            },
          },
        }),
      );
      expect(
        action.isValid(game, "owner-1", {
          roleId: WerewolfRole.Werewolf,
          targetPlayerId: "p3",
        }),
      ).toBe(true);
    });

    it("returns false for Monarch after 3 knightings have been used", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.Monarch],
          currentPhaseIndex: 0,
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Monarch },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Werewolf },
          ],
        },
      );
      (
        game.status as {
          turnState: WerewolfTurnState;
        }
      ).turnState.roleState = {
        monarch: { knightedPlayerIds: [], knightingsUsed: 3 },
      };
      expect(action.isValid(game, "p2", { targetPlayerId: "p3" })).toBe(false);
    });

    it("returns false for Monarch when targeting an already knighted player", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightPhaseOrder: [WerewolfRole.Monarch],
          currentPhaseIndex: 0,
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Monarch },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Werewolf },
          ],
        },
      );
      (
        game.status as {
          turnState: WerewolfTurnState;
        }
      ).turnState.roleState = {
        monarch: { knightedPlayerIds: ["p3"], knightingsUsed: 0 },
      };
      expect(action.isValid(game, "p2", { targetPlayerId: "p3" })).toBe(false);
    });
  });

  describe("isValid — Veteran", () => {
    const veteranTurn2State = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Veteran],
      currentPhaseIndex: 0,
    });

    it("allows alerted: true when alerts remaining", () => {
      const game = makePlayingGame(veteranTurn2State, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Veteran },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      expect(action.isValid(game, "p1", { alerted: true })).toBe(true);
    });

    it("blocks alerted: true when 3 alerts already used", () => {
      const game = makePlayingGame(
        { ...veteranTurn2State, roleState: { veteran: { alertsUsed: 3 } } },
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Veteran },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      expect(action.isValid(game, "p1", { alerted: true })).toBe(false);
    });

    it("still allows skip when 3 alerts already used", () => {
      const game = makePlayingGame(
        { ...veteranTurn2State, roleState: { veteran: { alertsUsed: 3 } } },
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Veteran },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      expect(action.isValid(game, "p1", { targetPlayerId: null })).toBe(true);
    });

    it("rejects targetPlayerId string for Veteran", () => {
      const game = makePlayingGame(veteranTurn2State, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Veteran },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(false);
    });

    it("rejects alerted: true combined with a targetPlayerId string", () => {
      const game = makePlayingGame(veteranTurn2State, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Veteran },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      expect(
        action.isValid(game, "p1", { alerted: true, targetPlayerId: "p2" }),
      ).toBe(false);
    });
  });

  describe("isValid — adjacentTargetOnly (The Thing)", () => {
    function makeThingGame(playerOrder: string[]) {
      const thingTurnState = makeNightState({
        turn: 2,
        nightPhaseOrder: [WerewolfRole.TheThing],
        currentPhaseIndex: 0,
      });
      return makePlayingGame(thingTurnState, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.TheThing },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
        playerOrder,
      });
    }

    it("allows The Thing to target the left neighbor", () => {
      const game = makeThingGame(["p1", "p2", "p3", "p4", "p5"]);
      // p1's left neighbor wraps to p5
      expect(action.isValid(game, "p1", { targetPlayerId: "p5" })).toBe(true);
    });

    it("allows The Thing to target the right neighbor", () => {
      const game = makeThingGame(["p1", "p2", "p3", "p4", "p5"]);
      // p1's right neighbor is p2
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(true);
    });

    it("rejects a non-adjacent target for The Thing", () => {
      const game = makeThingGame(["p1", "p2", "p3", "p4", "p5"]);
      // p3 is not adjacent to p1
      expect(action.isValid(game, "p1", { targetPlayerId: "p3" })).toBe(false);
    });

    it("allows owner to bypass adjacentTargetOnly restriction", () => {
      const game = makeThingGame(["p1", "p2", "p3", "p4", "p5"]);
      // Owner can assign any valid target even for adjacentTargetOnly roles
      expect(
        action.isValid(game, "owner-1", {
          roleId: WerewolfRole.TheThing,
          targetPlayerId: "p3",
        }),
      ).toBe(true);
    });

    it("skips the narrator when computing adjacency so a player next to the narrator has two selectable neighbours", () => {
      // playerOrder includes owner-1 between p1 and p2.
      // Without filtering, p1's right neighbour would be owner-1 (untargetable),
      // leaving p5 as the only selectable neighbour.
      // With narrator filtered out, p1's neighbours are p5 (left) and p2 (right).
      const game = makeThingGame(["p1", "owner-1", "p2", "p3", "p4", "p5"]);
      expect(action.isValid(game, "p1", { targetPlayerId: "p2" })).toBe(true);
      expect(action.isValid(game, "p1", { targetPlayerId: "p5" })).toBe(true);
      // p3 is still not adjacent to p1 after narrator removal
      expect(action.isValid(game, "p1", { targetPlayerId: "p3" })).toBe(false);
    });
  });
});
