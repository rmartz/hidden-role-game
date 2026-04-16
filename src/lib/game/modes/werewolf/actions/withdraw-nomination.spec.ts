import { describe, it, expect } from "vitest";
import { GameMode } from "@/lib/types";
import { WerewolfPhase, TrialPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame } from "./test-helpers";

function makeDayState(
  nominations: { nominatorId: string; defendantId: string }[] = [],
): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      ...(nominations.length > 0 ? { nominations } : {}),
    },
    deadPlayerIds: [],
  };
}

describe("WerewolfAction.WithdrawNomination", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.WithdrawNomination];

  describe("isValid", () => {
    it("returns true when caller has an existing nomination", () => {
      const game = makePlayingGame(
        makeDayState([{ nominatorId: "p2", defendantId: "p3" }]),
        {
          modeConfig: {
            gameMode: GameMode.Werewolf,
            nominationsEnabled: true,
            trialsPerDay: 1,
            revealProtections: true,
            hiddenRoleCount: 0,
            showRolesOnDeath: true,
          },
        },
      );
      expect(action.isValid(game, "p2", null)).toBe(true);
    });

    it("returns false when caller has no nomination", () => {
      const game = makePlayingGame(makeDayState(), {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          trialsPerDay: 1,
          revealProtections: true,
          hiddenRoleCount: 0,
          showRolesOnDeath: true,
        },
      });
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    it("returns false when caller is the owner", () => {
      const game = makePlayingGame(
        makeDayState([{ nominatorId: "owner-1", defendantId: "p3" }]),
        {
          modeConfig: {
            gameMode: GameMode.Werewolf,
            nominationsEnabled: true,
            trialsPerDay: 1,
            revealProtections: true,
            hiddenRoleCount: 0,
            showRolesOnDeath: true,
          },
        },
      );
      expect(action.isValid(game, "owner-1", null)).toBe(false);
    });

    it("returns false when an active unresolved trial is in progress", () => {
      const ts: WerewolfTurnState = {
        turn: 1,
        phase: {
          type: WerewolfPhase.Daytime,
          startedAt: 1000,
          nightActions: {},
          nominations: [{ nominatorId: "p2", defendantId: "p3" }],
          activeTrial: {
            defendantId: "p3",
            startedAt: 2000,
            phase: TrialPhase.Defense,
            votes: [],
          },
        },
        deadPlayerIds: [],
      };
      const game = makePlayingGame(ts, {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          trialsPerDay: 1,
          revealProtections: true,
          hiddenRoleCount: 0,
          showRolesOnDeath: true,
        },
      });
      expect(action.isValid(game, "p2", null)).toBe(false);
    });

    it("returns false during nighttime", () => {
      const ts: WerewolfTurnState = {
        turn: 1,
        phase: {
          type: WerewolfPhase.Nighttime,
          startedAt: 1000,
          nightPhaseOrder: [WerewolfRole.Werewolf],
          currentPhaseIndex: 0,
          nightActions: {},
        },
        deadPlayerIds: [],
      };
      const game = makePlayingGame(ts, {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          trialsPerDay: 1,
          revealProtections: true,
          hiddenRoleCount: 0,
          showRolesOnDeath: true,
        },
      });
      expect(action.isValid(game, "p2", null)).toBe(false);
    });
  });

  describe("apply", () => {
    it("removes the caller's nomination", () => {
      const game = makePlayingGame(
        makeDayState([
          { nominatorId: "p2", defendantId: "p3" },
          { nominatorId: "p4", defendantId: "p3" },
        ]),
        {
          modeConfig: {
            gameMode: GameMode.Werewolf,
            nominationsEnabled: true,
            trialsPerDay: 1,
            revealProtections: true,
            hiddenRoleCount: 0,
            showRolesOnDeath: true,
          },
        },
      );
      action.apply(game, null, "p2");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as Extract<
        WerewolfTurnState["phase"],
        { type: WerewolfPhase.Daytime }
      >;
      expect(phase.nominations?.some((n) => n.nominatorId === "p2")).toBe(
        false,
      );
      expect(phase.nominations).toContainEqual({
        nominatorId: "p4",
        defendantId: "p3",
      });
    });

    it("leaves other nominations intact", () => {
      const game = makePlayingGame(
        makeDayState([
          { nominatorId: "p2", defendantId: "p3" },
          { nominatorId: "p4", defendantId: "p3" },
        ]),
        {
          modeConfig: {
            gameMode: GameMode.Werewolf,
            nominationsEnabled: true,
            trialsPerDay: 1,
            revealProtections: true,
            hiddenRoleCount: 0,
            showRolesOnDeath: true,
          },
        },
      );
      action.apply(game, null, "p2");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as Extract<
        WerewolfTurnState["phase"],
        { type: WerewolfPhase.Daytime }
      >;
      expect(phase.nominations).toHaveLength(1);
    });
  });
});
