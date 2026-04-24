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
  MAYOR_PLAYER_ID,
} from "./test-helpers";

describe("ClocktowerAction.SetNightTarget", () => {
  const action = CLOCKTOWER_ACTIONS[ClocktowerAction.SetNightTarget];

  describe("isValid", () => {
    it("returns true when a player sets their target to an alive player", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, IMP_PLAYER_ID, {
          targetPlayerId: EMPATH_PLAYER_ID,
        }),
      ).toBe(true);
    });

    it("returns true when Storyteller sets a target with explicit roleId", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, OWNER_ID, {
          roleId: ClocktowerRole.Imp,
          targetPlayerId: EMPATH_PLAYER_ID,
        }),
      ).toBe(true);
    });

    it("returns true when clearing a target (targetPlayerId omitted)", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.Imp]: { targetPlayerId: EMPATH_PLAYER_ID },
          },
        }),
      );
      expect(action.isValid(game, IMP_PLAYER_ID, {})).toBe(true);
    });

    it("returns false when target is a dead player", () => {
      const game = makePlayingGame(
        makeNightState({ deadPlayerIds: [EMPATH_PLAYER_ID] }),
      );
      expect(
        action.isValid(game, IMP_PLAYER_ID, {
          targetPlayerId: EMPATH_PLAYER_ID,
        }),
      ).toBe(false);
    });

    it("returns false when target is not in the game", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, IMP_PLAYER_ID, { targetPlayerId: "unknown-id" }),
      ).toBe(false);
    });

    it("returns false when target is the Storyteller (owner)", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, IMP_PLAYER_ID, { targetPlayerId: OWNER_ID }),
      ).toBe(false);
    });

    it("returns false when caller has no role assignment", () => {
      const game = makePlayingGame(makeNightState(), { roleAssignments: [] });
      expect(
        action.isValid(game, IMP_PLAYER_ID, {
          targetPlayerId: EMPATH_PLAYER_ID,
        }),
      ).toBe(false);
    });

    it("returns false when the action is already confirmed", () => {
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
      expect(
        action.isValid(game, IMP_PLAYER_ID, {
          targetPlayerId: MAYOR_PLAYER_ID,
        }),
      ).toBe(false);
    });

    it("returns false when the game is not in Playing status", () => {
      const game = makePlayingGame(makeNightState(), {
        status: { type: GameStatus.Finished },
      });
      expect(
        action.isValid(game, IMP_PLAYER_ID, {
          targetPlayerId: EMPATH_PLAYER_ID,
        }),
      ).toBe(false);
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
      expect(
        action.isValid(game, IMP_PLAYER_ID, {
          targetPlayerId: EMPATH_PLAYER_ID,
        }),
      ).toBe(false);
    });

    it("returns false when Storyteller omits roleId", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, OWNER_ID, { targetPlayerId: EMPATH_PLAYER_ID }),
      ).toBe(false);
    });

    it("returns true when secondTargetPlayerId is a valid alive player", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, FORTUNE_TELLER_PLAYER_ID, {
          targetPlayerId: IMP_PLAYER_ID,
          secondTargetPlayerId: EMPATH_PLAYER_ID,
        }),
      ).toBe(true);
    });

    it("returns false when secondTargetPlayerId is a dead player", () => {
      const game = makePlayingGame(
        makeNightState({ deadPlayerIds: [EMPATH_PLAYER_ID] }),
      );
      expect(
        action.isValid(game, FORTUNE_TELLER_PLAYER_ID, {
          targetPlayerId: IMP_PLAYER_ID,
          secondTargetPlayerId: EMPATH_PLAYER_ID,
        }),
      ).toBe(false);
    });

    it("returns false when secondTargetPlayerId is not in the game", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, FORTUNE_TELLER_PLAYER_ID, {
          targetPlayerId: IMP_PLAYER_ID,
          secondTargetPlayerId: "unknown-id",
        }),
      ).toBe(false);
    });

    it("returns false when secondTargetPlayerId is the Storyteller", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, FORTUNE_TELLER_PLAYER_ID, {
          targetPlayerId: IMP_PLAYER_ID,
          secondTargetPlayerId: OWNER_ID,
        }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets the targetPlayerId for the player's role", () => {
      const game = makePlayingGame(makeNightState());
      action.apply(game, { targetPlayerId: EMPATH_PLAYER_ID }, IMP_PLAYER_ID);
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      expect(phase.nightActions[ClocktowerRole.Imp]?.targetPlayerId).toBe(
        EMPATH_PLAYER_ID,
      );
    });

    it("sets a target for a role via Storyteller override", () => {
      const game = makePlayingGame(makeNightState());
      action.apply(
        game,
        { roleId: ClocktowerRole.Empath, targetPlayerId: IMP_PLAYER_ID },
        OWNER_ID,
      );
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      expect(phase.nightActions[ClocktowerRole.Empath]?.targetPlayerId).toBe(
        IMP_PLAYER_ID,
      );
    });

    it("stores secondTargetPlayerId for Fortune Teller", () => {
      const game = makePlayingGame(makeNightState());
      action.apply(
        game,
        {
          targetPlayerId: IMP_PLAYER_ID,
          secondTargetPlayerId: EMPATH_PLAYER_ID,
        },
        FORTUNE_TELLER_PLAYER_ID,
      );
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      const ftAction = phase.nightActions[ClocktowerRole.FortuneTeller];
      expect(ftAction?.targetPlayerId).toBe(IMP_PLAYER_ID);
      expect(ftAction?.secondTargetPlayerId).toBe(EMPATH_PLAYER_ID);
    });

    it("clears the target when targetPlayerId is omitted", () => {
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
      expect(
        phase.nightActions[ClocktowerRole.Imp]?.targetPlayerId,
      ).toBeUndefined();
    });

    it("preserves existing action fields when updating target", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.FortuneTeller]: {
              secondTargetPlayerId: EMPATH_PLAYER_ID,
            },
          },
        }),
      );
      action.apply(
        game,
        { targetPlayerId: IMP_PLAYER_ID },
        FORTUNE_TELLER_PLAYER_ID,
      );
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      const ftAction = phase.nightActions[ClocktowerRole.FortuneTeller];
      expect(ftAction?.targetPlayerId).toBe(IMP_PLAYER_ID);
      expect(ftAction?.secondTargetPlayerId).toBe(EMPATH_PLAYER_ID);
    });
  });
});
