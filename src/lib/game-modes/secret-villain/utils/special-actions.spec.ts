import { describe, it, expect } from "vitest";
import { SpecialActionType, SvBoardPreset } from "../types";
import { getSpecialAction } from "./special-actions";

describe("getSpecialAction", () => {
  describe("Small board (5-6 players)", () => {
    it("no action at bad card 1", () => {
      expect(getSpecialAction(1, SvBoardPreset.Small)).toBeUndefined();
    });

    it("no action at bad card 2", () => {
      expect(getSpecialAction(2, SvBoardPreset.Small)).toBeUndefined();
    });

    it("PolicyPeek at bad card 3", () => {
      expect(getSpecialAction(3, SvBoardPreset.Small)).toBe(
        SpecialActionType.PolicyPeek,
      );
    });

    it("Shoot at bad card 4", () => {
      expect(getSpecialAction(4, SvBoardPreset.Small)).toBe(
        SpecialActionType.Shoot,
      );
    });

    it("Shoot at bad card 5", () => {
      expect(getSpecialAction(5, SvBoardPreset.Small)).toBe(
        SpecialActionType.Shoot,
      );
    });
  });

  describe("Medium board (7-8 players)", () => {
    it("no action at bad card 1", () => {
      expect(getSpecialAction(1, SvBoardPreset.Medium)).toBeUndefined();
    });

    it("InvestigateTeam at bad card 2", () => {
      expect(getSpecialAction(2, SvBoardPreset.Medium)).toBe(
        SpecialActionType.InvestigateTeam,
      );
    });

    it("SpecialElection at bad card 3", () => {
      expect(getSpecialAction(3, SvBoardPreset.Medium)).toBe(
        SpecialActionType.SpecialElection,
      );
    });

    it("Shoot at bad card 4", () => {
      expect(getSpecialAction(4, SvBoardPreset.Medium)).toBe(
        SpecialActionType.Shoot,
      );
    });

    it("Shoot at bad card 5", () => {
      expect(getSpecialAction(5, SvBoardPreset.Medium)).toBe(
        SpecialActionType.Shoot,
      );
    });
  });

  describe("Large board (9-10 players)", () => {
    it("InvestigateTeam at bad card 1", () => {
      expect(getSpecialAction(1, SvBoardPreset.Large)).toBe(
        SpecialActionType.InvestigateTeam,
      );
    });

    it("InvestigateTeam at bad card 2", () => {
      expect(getSpecialAction(2, SvBoardPreset.Large)).toBe(
        SpecialActionType.InvestigateTeam,
      );
    });

    it("SpecialElection at bad card 3", () => {
      expect(getSpecialAction(3, SvBoardPreset.Large)).toBe(
        SpecialActionType.SpecialElection,
      );
    });

    it("Shoot at bad card 4", () => {
      expect(getSpecialAction(4, SvBoardPreset.Large)).toBe(
        SpecialActionType.Shoot,
      );
    });

    it("Shoot at bad card 5", () => {
      expect(getSpecialAction(5, SvBoardPreset.Large)).toBe(
        SpecialActionType.Shoot,
      );
    });
  });
});
