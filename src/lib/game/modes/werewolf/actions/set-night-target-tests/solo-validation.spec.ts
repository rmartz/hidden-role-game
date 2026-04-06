import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../index";
import {
  makePlayingGame,
  makeNightState,
  nightTurn2State,
  nightTurnState,
  dayTurnState,
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
  });
});
