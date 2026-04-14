import { describe, it, expect } from "vitest";
import {
  DEFAULT_WEREWOLF_MODE_CONFIG,
  parseWerewolfModeConfig,
} from "./lobby-config";

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

describe("DEFAULT_WEREWOLF_MODE_CONFIG", () => {
  it("enables showRolesOnDeath by default", () => {
    expect(DEFAULT_WEREWOLF_MODE_CONFIG.showRolesOnDeath).toBe(true);
  });
});
