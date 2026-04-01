import { describe, it, expect } from "vitest";
import { SpecialActionType } from "../types";
import { getSpecialAction } from "./special-actions";

describe("getSpecialAction", () => {
  describe("5-6 players", () => {
    it.each([5, 6])("no action at bad card 1 (%i players)", (count) => {
      expect(getSpecialAction(1, count)).toBeUndefined();
    });

    it.each([5, 6])("no action at bad card 2 (%i players)", (count) => {
      expect(getSpecialAction(2, count)).toBeUndefined();
    });

    it.each([5, 6])("PolicyPeek at bad card 3 (%i players)", (count) => {
      expect(getSpecialAction(3, count)).toBe(SpecialActionType.PolicyPeek);
    });

    it.each([5, 6])("Shoot at bad card 4 (%i players)", (count) => {
      expect(getSpecialAction(4, count)).toBe(SpecialActionType.Shoot);
    });

    it.each([5, 6])("Shoot at bad card 5 (%i players)", (count) => {
      expect(getSpecialAction(5, count)).toBe(SpecialActionType.Shoot);
    });
  });

  describe("7-8 players", () => {
    it.each([7, 8])("no action at bad card 1 (%i players)", (count) => {
      expect(getSpecialAction(1, count)).toBeUndefined();
    });

    it.each([7, 8])("InvestigateTeam at bad card 2 (%i players)", (count) => {
      expect(getSpecialAction(2, count)).toBe(
        SpecialActionType.InvestigateTeam,
      );
    });

    it.each([7, 8])("SpecialElection at bad card 3 (%i players)", (count) => {
      expect(getSpecialAction(3, count)).toBe(
        SpecialActionType.SpecialElection,
      );
    });

    it.each([7, 8])("Shoot at bad card 4 (%i players)", (count) => {
      expect(getSpecialAction(4, count)).toBe(SpecialActionType.Shoot);
    });

    it.each([7, 8])("Shoot at bad card 5 (%i players)", (count) => {
      expect(getSpecialAction(5, count)).toBe(SpecialActionType.Shoot);
    });
  });

  describe("9-10 players", () => {
    it.each([9, 10])("InvestigateTeam at bad card 1 (%i players)", (count) => {
      expect(getSpecialAction(1, count)).toBe(
        SpecialActionType.InvestigateTeam,
      );
    });

    it.each([9, 10])("InvestigateTeam at bad card 2 (%i players)", (count) => {
      expect(getSpecialAction(2, count)).toBe(
        SpecialActionType.InvestigateTeam,
      );
    });

    it.each([9, 10])("SpecialElection at bad card 3 (%i players)", (count) => {
      expect(getSpecialAction(3, count)).toBe(
        SpecialActionType.SpecialElection,
      );
    });

    it.each([9, 10])("Shoot at bad card 4 (%i players)", (count) => {
      expect(getSpecialAction(4, count)).toBe(SpecialActionType.Shoot);
    });

    it.each([9, 10])("Shoot at bad card 5 (%i players)", (count) => {
      expect(getSpecialAction(5, count)).toBe(SpecialActionType.Shoot);
    });
  });
});
