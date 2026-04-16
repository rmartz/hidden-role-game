import { describe, it, expect } from "vitest";
import { parseWerewolfModeConfig } from "./lobby-config";

describe("parseWerewolfModeConfig", () => {
  it("defaults showRolesOnDeath when the field is absent", () => {
    const parsed = parseWerewolfModeConfig({});

    expect(parsed.showRolesOnDeath).toBe(true);
  });
});
