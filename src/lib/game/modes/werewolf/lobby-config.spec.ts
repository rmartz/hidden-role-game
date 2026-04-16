import { describe, it, expect } from "vitest";
import { parseWerewolfModeConfig } from "./lobby-config";

describe("parseWerewolfModeConfig", () => {
  it("defaults showRolesOnDeath to enabled", () => {
    const parsed = parseWerewolfModeConfig({});

    expect(parsed.showRolesOnDeath).toBe(true);
  });

  it("parses showRolesOnDeath when provided", () => {
    const parsed = parseWerewolfModeConfig({ showRolesOnDeath: false });

    expect(parsed.showRolesOnDeath).toBe(false);
  });
});
