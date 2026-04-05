import { describe, it, expect } from "vitest";
import { SpecialActionType, SvBoardPreset } from "../types";
import type { SvCustomPowerConfig } from "../types";
import {
  BOARD_PRESETS,
  getSpecialAction,
  resolveCustomPowerTable,
  resolvePowerTable,
} from "./special-actions";

describe("getSpecialAction", () => {
  describe("Small board (5-6 players)", () => {
    const table = BOARD_PRESETS[SvBoardPreset.Small];

    it("no action at bad card 1", () => {
      expect(getSpecialAction(1, table)).toBeUndefined();
    });

    it("no action at bad card 2", () => {
      expect(getSpecialAction(2, table)).toBeUndefined();
    });

    it("PolicyPeek at bad card 3", () => {
      expect(getSpecialAction(3, table)).toBe(SpecialActionType.PolicyPeek);
    });

    it("Shoot at bad card 4", () => {
      expect(getSpecialAction(4, table)).toBe(SpecialActionType.Shoot);
    });

    it("Shoot at bad card 5", () => {
      expect(getSpecialAction(5, table)).toBe(SpecialActionType.Shoot);
    });
  });

  describe("Medium board (7-8 players)", () => {
    const table = BOARD_PRESETS[SvBoardPreset.Medium];

    it("no action at bad card 1", () => {
      expect(getSpecialAction(1, table)).toBeUndefined();
    });

    it("InvestigateTeam at bad card 2", () => {
      expect(getSpecialAction(2, table)).toBe(
        SpecialActionType.InvestigateTeam,
      );
    });

    it("SpecialElection at bad card 3", () => {
      expect(getSpecialAction(3, table)).toBe(
        SpecialActionType.SpecialElection,
      );
    });

    it("Shoot at bad card 4", () => {
      expect(getSpecialAction(4, table)).toBe(SpecialActionType.Shoot);
    });

    it("Shoot at bad card 5", () => {
      expect(getSpecialAction(5, table)).toBe(SpecialActionType.Shoot);
    });
  });

  describe("Large board (9-10 players)", () => {
    const table = BOARD_PRESETS[SvBoardPreset.Large];

    it("InvestigateTeam at bad card 1", () => {
      expect(getSpecialAction(1, table)).toBe(
        SpecialActionType.InvestigateTeam,
      );
    });

    it("InvestigateTeam at bad card 2", () => {
      expect(getSpecialAction(2, table)).toBe(
        SpecialActionType.InvestigateTeam,
      );
    });

    it("SpecialElection at bad card 3", () => {
      expect(getSpecialAction(3, table)).toBe(
        SpecialActionType.SpecialElection,
      );
    });

    it("Shoot at bad card 4", () => {
      expect(getSpecialAction(4, table)).toBe(SpecialActionType.Shoot);
    });

    it("Shoot at bad card 5", () => {
      expect(getSpecialAction(5, table)).toBe(SpecialActionType.Shoot);
    });
  });

  describe("Custom power table", () => {
    it("uses custom powers for cards 1-3 and Shoot for cards 4-5", () => {
      const custom: SvCustomPowerConfig = [
        SpecialActionType.PolicyPeek,
        SpecialActionType.InvestigateTeam,
        SpecialActionType.SpecialElection,
      ];
      const table = resolveCustomPowerTable(custom);
      expect(getSpecialAction(1, table)).toBe(SpecialActionType.PolicyPeek);
      expect(getSpecialAction(2, table)).toBe(
        SpecialActionType.InvestigateTeam,
      );
      expect(getSpecialAction(3, table)).toBe(
        SpecialActionType.SpecialElection,
      );
      expect(getSpecialAction(4, table)).toBe(SpecialActionType.Shoot);
      expect(getSpecialAction(5, table)).toBe(SpecialActionType.Shoot);
    });

    it("supports undefined (no action) in custom slots", () => {
      const custom: SvCustomPowerConfig = [undefined, undefined, undefined];
      const table = resolveCustomPowerTable(custom);
      expect(getSpecialAction(1, table)).toBeUndefined();
      expect(getSpecialAction(2, table)).toBeUndefined();
      expect(getSpecialAction(3, table)).toBeUndefined();
      expect(getSpecialAction(4, table)).toBe(SpecialActionType.Shoot);
      expect(getSpecialAction(5, table)).toBe(SpecialActionType.Shoot);
    });
  });
});

describe("resolvePowerTable", () => {
  it("returns the preset table for non-custom presets", () => {
    expect(resolvePowerTable(SvBoardPreset.Small)).toBe(
      BOARD_PRESETS[SvBoardPreset.Small],
    );
    expect(resolvePowerTable(SvBoardPreset.Medium)).toBe(
      BOARD_PRESETS[SvBoardPreset.Medium],
    );
    expect(resolvePowerTable(SvBoardPreset.Large)).toBe(
      BOARD_PRESETS[SvBoardPreset.Large],
    );
  });

  it("resolves custom preset with provided config", () => {
    const custom: SvCustomPowerConfig = [
      SpecialActionType.PolicyPeek,
      undefined,
      SpecialActionType.InvestigateTeam,
    ];
    const table = resolvePowerTable(SvBoardPreset.Custom, custom);
    expect(table).toEqual([
      SpecialActionType.PolicyPeek,
      undefined,
      SpecialActionType.InvestigateTeam,
      SpecialActionType.Shoot,
      SpecialActionType.Shoot,
    ]);
  });

  it("uses default custom config when custom preset has no table", () => {
    const table = resolvePowerTable(SvBoardPreset.Custom);
    expect(table).toEqual([
      undefined,
      undefined,
      undefined,
      SpecialActionType.Shoot,
      SpecialActionType.Shoot,
    ]);
  });
});
