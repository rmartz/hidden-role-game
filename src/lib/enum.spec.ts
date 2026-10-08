import { describe, expect, it } from "vitest";

import { isEnumValue } from "./enum";
import { GameMode } from "./types";

describe("isEnumValue", () => {
  it("accepts every member of the enum", () => {
    for (const mode of Object.values(GameMode)) {
      expect(isEnumValue(GameMode, mode)).toBe(true);
    }
  });

  it("rejects strings that are not enum values", () => {
    expect(isEnumValue(GameMode, "unknown-mode")).toBe(false);
    // Enum keys are not values.
    expect(isEnumValue(GameMode, "Werewolf")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isEnumValue(GameMode, undefined)).toBe(false);
    expect(isEnumValue(GameMode, null)).toBe(false);
    expect(isEnumValue(GameMode, 0)).toBe(false);
    expect(isEnumValue(GameMode, {})).toBe(false);
  });
});
