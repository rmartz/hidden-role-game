import { describe, it, expect } from "vitest";
import { GameMode } from "@/lib/types";
import { SpecialActionType, SvBoardPreset } from "./types";
import { parseSecretVillainModeConfig } from "./lobby-config";

describe("parseSecretVillainModeConfig", () => {
  it("returns default config for empty input", () => {
    expect(parseSecretVillainModeConfig({})).toEqual({
      gameMode: GameMode.SecretVillain,
    });
  });

  it("parses a valid board preset", () => {
    const result = parseSecretVillainModeConfig({
      boardPreset: SvBoardPreset.Large,
    });
    expect(result.boardPreset).toBe(SvBoardPreset.Large);
  });

  it("ignores invalid board preset", () => {
    const result = parseSecretVillainModeConfig({
      boardPreset: "invalid",
    });
    expect(result.boardPreset).toBeUndefined();
  });

  it("parses custom power table when preset is Custom", () => {
    const result = parseSecretVillainModeConfig({
      boardPreset: SvBoardPreset.Custom,
      customPowerTable: [
        SpecialActionType.PolicyPeek,
        SpecialActionType.InvestigateTeam,
        SpecialActionType.SpecialElection,
      ],
    });
    expect(result.boardPreset).toBe(SvBoardPreset.Custom);
    expect(result.customPowerTable).toEqual([
      SpecialActionType.PolicyPeek,
      SpecialActionType.InvestigateTeam,
      SpecialActionType.SpecialElection,
    ]);
  });

  it("normalizes invalid slots to undefined in custom power table", () => {
    const result = parseSecretVillainModeConfig({
      boardPreset: SvBoardPreset.Custom,
      customPowerTable: ["invalid", SpecialActionType.PolicyPeek, null],
    });
    expect(result.customPowerTable).toEqual([
      undefined,
      SpecialActionType.PolicyPeek,
      undefined,
    ]);
  });

  it("ignores custom power table for non-custom presets", () => {
    const result = parseSecretVillainModeConfig({
      boardPreset: SvBoardPreset.Medium,
      customPowerTable: [
        SpecialActionType.PolicyPeek,
        SpecialActionType.InvestigateTeam,
        SpecialActionType.SpecialElection,
      ],
    });
    expect(result.customPowerTable).toBeUndefined();
  });

  it("handles missing custom power table for Custom preset", () => {
    const result = parseSecretVillainModeConfig({
      boardPreset: SvBoardPreset.Custom,
    });
    expect(result.boardPreset).toBe(SvBoardPreset.Custom);
    expect(result.customPowerTable).toBeUndefined();
  });
});
