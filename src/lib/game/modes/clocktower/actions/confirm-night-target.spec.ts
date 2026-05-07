import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { ClocktowerPhase } from "../types";
import type { ClocktowerTurnState, ClocktowerNightPhase } from "../types";
import { ClocktowerRole } from "../roles";
import { CLOCKTOWER_ACTIONS, ClocktowerAction } from "./index";
import {
  makePlayingGame,
  makeNightState,
  OWNER_ID,
  IMP_PLAYER_ID,
  EMPATH_PLAYER_ID,
  FORTUNE_TELLER_PLAYER_ID,
} from "./test-helpers";

describe("ClocktowerAction.ConfirmNightTarget", () => {
  const action = CLOCKTOWER_ACTIONS[ClocktowerAction.ConfirmNightTarget];

  describe("isValid", () => {
    it("returns true when a player has an unconfirmed target", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.Imp]: { targetPlayerId: EMPATH_PLAYER_ID },
          },
        }),
      );
      expect(action.isValid(game, IMP_PLAYER_ID, {})).toBe(true);
    });

    it("returns true when Storyteller confirms via explicit roleId", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.Imp]: { targetPlayerId: EMPATH_PLAYER_ID },
          },
        }),
      );
      expect(
        action.isValid(game, OWNER_ID, { roleId: ClocktowerRole.Imp }),
      ).toBe(true);
    });

    it("returns false when no action exists for the role", () => {
      const game = makePlayingGame(makeNightState());
      expect(action.isValid(game, IMP_PLAYER_ID, {})).toBe(false);
    });

    it("returns false when action is already confirmed", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.Imp]: {
              targetPlayerId: EMPATH_PLAYER_ID,
              confirmed: true,
            },
          },
        }),
      );
      expect(action.isValid(game, IMP_PLAYER_ID, {})).toBe(false);
    });

    it("returns false when action has no targetPlayerId", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.Imp]: {},
          },
        }),
      );
      expect(action.isValid(game, IMP_PLAYER_ID, {})).toBe(false);
    });

    it("returns false when Fortune Teller has only one target", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.FortuneTeller]: {
              targetPlayerId: IMP_PLAYER_ID,
            },
          },
        }),
      );
      expect(action.isValid(game, FORTUNE_TELLER_PLAYER_ID, {})).toBe(false);
    });

    it("returns true when Fortune Teller has both targets", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.FortuneTeller]: {
              targetPlayerId: IMP_PLAYER_ID,
              secondTargetPlayerId: EMPATH_PLAYER_ID,
            },
          },
        }),
      );
      expect(action.isValid(game, FORTUNE_TELLER_PLAYER_ID, {})).toBe(true);
    });

    it("returns false when caller has no role assignment", () => {
      const game = makePlayingGame(makeNightState(), { roleAssignments: [] });
      expect(action.isValid(game, IMP_PLAYER_ID, {})).toBe(false);
    });

    it("returns false when game is not in Playing status", () => {
      const game = makePlayingGame(makeNightState(), {
        status: { type: GameStatus.Finished },
      });
      expect(action.isValid(game, IMP_PLAYER_ID, {})).toBe(false);
    });

    it("returns false when game is in day phase", () => {
      const dayTurnState: ClocktowerTurnState = {
        turn: 1,
        phase: {
          type: ClocktowerPhase.Day,
          nominations: [],
          nominatedByPlayerIds: [],
        },
        playerOrder: [],
        deadPlayerIds: [],
        ghostVotesUsed: [],
        demonPlayerId: IMP_PLAYER_ID,
      };
      const game = makePlayingGame(dayTurnState);
      expect(action.isValid(game, IMP_PLAYER_ID, {})).toBe(false);
    });

    it("returns false when Storyteller omits roleId", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.Imp]: { targetPlayerId: EMPATH_PLAYER_ID },
          },
        }),
      );
      expect(action.isValid(game, OWNER_ID, {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets confirmed: true on the role's night action", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.Imp]: { targetPlayerId: EMPATH_PLAYER_ID },
          },
        }),
      );
      action.apply(game, {}, IMP_PLAYER_ID);
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      expect(phase.nightActions[ClocktowerRole.Imp]).toEqual({
        targetPlayerId: EMPATH_PLAYER_ID,
        confirmed: true,
      });
    });

    it("preserves existing action fields when confirming", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.FortuneTeller]: {
              targetPlayerId: IMP_PLAYER_ID,
              secondTargetPlayerId: EMPATH_PLAYER_ID,
            },
          },
        }),
      );
      action.apply(game, {}, FORTUNE_TELLER_PLAYER_ID);
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      expect(phase.nightActions[ClocktowerRole.FortuneTeller]).toEqual({
        targetPlayerId: IMP_PLAYER_ID,
        secondTargetPlayerId: EMPATH_PLAYER_ID,
        confirmed: true,
      });
    });

    it("does not affect other roles' night actions", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.Imp]: { targetPlayerId: EMPATH_PLAYER_ID },
            [ClocktowerRole.Empath]: { targetPlayerId: IMP_PLAYER_ID },
          },
        }),
      );
      action.apply(game, {}, IMP_PLAYER_ID);
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      expect(phase.nightActions[ClocktowerRole.Empath]).toEqual({
        targetPlayerId: IMP_PLAYER_ID,
      });
    });
  });
});
