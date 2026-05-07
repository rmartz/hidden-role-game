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
  WASHERWOMAN_PLAYER_ID,
} from "./test-helpers";

describe("ClocktowerAction.ProvideInformation", () => {
  const action = CLOCKTOWER_ACTIONS[ClocktowerAction.ProvideInformation];

  describe("isValid", () => {
    it("returns true for a number information payload (Empath)", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, OWNER_ID, {
          roleId: ClocktowerRole.Empath,
          information: { type: "number", value: 1 },
        }),
      ).toBe(true);
    });

    it("returns true for a boolean information payload (Fortune Teller)", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, OWNER_ID, {
          roleId: ClocktowerRole.FortuneTeller,
          information: { type: "boolean", value: false },
        }),
      ).toBe(true);
    });

    it("returns true for a role information payload (Undertaker)", () => {
      const game = makePlayingGame(makeNightState(), {
        roleAssignments: [
          { playerId: IMP_PLAYER_ID, roleDefinitionId: ClocktowerRole.Imp },
          {
            playerId: EMPATH_PLAYER_ID,
            roleDefinitionId: ClocktowerRole.Empath,
          },
          {
            playerId: WASHERWOMAN_PLAYER_ID,
            roleDefinitionId: ClocktowerRole.Undertaker,
          },
        ],
      });
      expect(
        action.isValid(game, OWNER_ID, {
          roleId: ClocktowerRole.Undertaker,
          information: { type: "role", roleId: ClocktowerRole.Imp },
        }),
      ).toBe(true);
    });

    it("returns true for a two-players-role payload (Washerwoman)", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, OWNER_ID, {
          roleId: ClocktowerRole.Washerwoman,
          information: {
            type: "two-players-role",
            playerIds: [IMP_PLAYER_ID, EMPATH_PLAYER_ID],
            roleId: ClocktowerRole.Empath,
          },
        }),
      ).toBe(true);
    });

    it("returns false when caller is not the Storyteller", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, IMP_PLAYER_ID, {
          roleId: ClocktowerRole.Empath,
          information: { type: "number", value: 0 },
        }),
      ).toBe(false);
    });

    it("returns false when roleId is not a valid ClocktowerRole", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, OWNER_ID, {
          roleId: "not-a-role",
          information: { type: "number", value: 0 },
        }),
      ).toBe(false);
    });

    it("returns false when information type is unknown", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, OWNER_ID, {
          roleId: ClocktowerRole.Empath,
          information: { type: "unknown" },
        }),
      ).toBe(false);
    });

    it("returns false when two-players-role has a player not in the game", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, OWNER_ID, {
          roleId: ClocktowerRole.Washerwoman,
          information: {
            type: "two-players-role",
            playerIds: [IMP_PLAYER_ID, "not-in-game"],
            roleId: ClocktowerRole.Empath,
          },
        }),
      ).toBe(false);
    });

    it("returns false when two-players-role roleId is not a valid ClocktowerRole", () => {
      const game = makePlayingGame(makeNightState());
      expect(
        action.isValid(game, OWNER_ID, {
          roleId: ClocktowerRole.Washerwoman,
          information: {
            type: "two-players-role",
            playerIds: [IMP_PLAYER_ID, EMPATH_PLAYER_ID],
            roleId: "not-a-role",
          },
        }),
      ).toBe(false);
    });

    it("returns false when game is not in Playing status", () => {
      const game = makePlayingGame(makeNightState(), {
        status: { type: GameStatus.Finished },
      });
      expect(
        action.isValid(game, OWNER_ID, {
          roleId: ClocktowerRole.Empath,
          information: { type: "number", value: 0 },
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
        action.isValid(game, OWNER_ID, {
          roleId: ClocktowerRole.Empath,
          information: { type: "number", value: 0 },
        }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("records number information for Empath", () => {
      const game = makePlayingGame(makeNightState());
      action.apply(
        game,
        {
          roleId: ClocktowerRole.Empath,
          information: { type: "number", value: 2 },
        },
        OWNER_ID,
      );
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      expect(phase.nightActions[ClocktowerRole.Empath]?.information).toEqual({
        type: "number",
        value: 2,
      });
    });

    it("records boolean information for Fortune Teller", () => {
      const game = makePlayingGame(makeNightState());
      action.apply(
        game,
        {
          roleId: ClocktowerRole.FortuneTeller,
          information: { type: "boolean", value: true },
        },
        OWNER_ID,
      );
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      expect(
        phase.nightActions[ClocktowerRole.FortuneTeller]?.information,
      ).toEqual({ type: "boolean", value: true });
    });

    it("records two-players-role information for Washerwoman", () => {
      const game = makePlayingGame(makeNightState());
      action.apply(
        game,
        {
          roleId: ClocktowerRole.Washerwoman,
          information: {
            type: "two-players-role",
            playerIds: [IMP_PLAYER_ID, EMPATH_PLAYER_ID],
            roleId: ClocktowerRole.Empath,
          },
        },
        OWNER_ID,
      );
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      expect(
        phase.nightActions[ClocktowerRole.Washerwoman]?.information,
      ).toEqual({
        type: "two-players-role",
        playerIds: [IMP_PLAYER_ID, EMPATH_PLAYER_ID],
        roleId: ClocktowerRole.Empath,
      });
    });

    it("preserves existing action fields when adding information", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.Washerwoman]: {
              targetPlayerId: WASHERWOMAN_PLAYER_ID,
              confirmed: true,
            },
          },
        }),
      );
      action.apply(
        game,
        {
          roleId: ClocktowerRole.Washerwoman,
          information: {
            type: "two-players-role",
            playerIds: [IMP_PLAYER_ID, EMPATH_PLAYER_ID],
            roleId: ClocktowerRole.Empath,
          },
        },
        OWNER_ID,
      );
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      const ww = phase.nightActions[ClocktowerRole.Washerwoman];
      expect(ww?.targetPlayerId).toBe(WASHERWOMAN_PLAYER_ID);
      expect(ww?.confirmed).toBe(true);
      expect(ww?.information).toEqual({
        type: "two-players-role",
        playerIds: [IMP_PLAYER_ID, EMPATH_PLAYER_ID],
        roleId: ClocktowerRole.Empath,
      });
    });

    it("does not affect other roles' night actions", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [ClocktowerRole.Imp]: { targetPlayerId: EMPATH_PLAYER_ID },
          },
        }),
      );
      action.apply(
        game,
        {
          roleId: ClocktowerRole.Empath,
          information: { type: "number", value: 1 },
        },
        OWNER_ID,
      );
      const ts = (game.status as { turnState: ClocktowerTurnState }).turnState;
      const phase = ts.phase as ClocktowerNightPhase;
      expect(phase.nightActions[ClocktowerRole.Imp]).toEqual({
        targetPlayerId: EMPATH_PLAYER_ID,
      });
    });
  });
});
