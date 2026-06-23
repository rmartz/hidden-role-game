import { describe, expect, it } from "vitest";

import { GameMode } from "@/lib/types";

import { DEFAULT_THEME, resolveGameModeTheme } from "./theme";

describe("resolveGameModeTheme", () => {
  it("returns twilight_modern as the default theme", () => {
    expect(DEFAULT_THEME).toBe("twilight_modern");
  });

  it("returns twilight_modern for undefined game mode", () => {
    expect(resolveGameModeTheme(undefined)).toBe("twilight_modern");
  });

  it("returns twilight_modern for a game mode with no configured theme", () => {
    // All modes without a theme field should fall back to the default
    const result = resolveGameModeTheme(GameMode.Codenames);
    expect(result).toBe("twilight_modern");
  });

  it("returns the mode's configured theme when set", () => {
    // Werewolf uses the werewolf theme
    const result = resolveGameModeTheme(GameMode.Werewolf);
    expect(result).toBe("werewolf");
  });

  it("returns the correct theme for each game mode that has one configured", () => {
    expect(resolveGameModeTheme(GameMode.Avalon)).toBe("avalon");
    expect(resolveGameModeTheme(GameMode.SecretVillain)).toBe("secret_villain");
  });
});
