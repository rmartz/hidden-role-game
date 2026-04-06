import { describe, it, expect } from "vitest";
import { GameMode } from "@/lib/types";
import {
  DEFAULT_GAME_MODE,
  ENABLED_GAME_MODES,
  GAME_MODES,
  isGameModeEnabled,
  parseGameMode,
} from "./modes";

describe("GAME_MODES", () => {
  it("has a config for every GameMode enum value", () => {
    for (const mode of Object.values(GameMode)) {
      expect(GAME_MODES[mode]).toBeDefined();
    }
  });

  it("Werewolf is released", () => {
    expect(GAME_MODES[GameMode.Werewolf].released).toBe(true);
  });

  it("Secret Villain is released", () => {
    expect(GAME_MODES[GameMode.SecretVillain].released).toBe(true);
  });

  it("Avalon is not released", () => {
    expect(GAME_MODES[GameMode.Avalon].released).toBe(false);
  });
});

describe("isGameModeEnabled", () => {
  it("returns true for released modes", () => {
    expect(isGameModeEnabled(GameMode.Werewolf)).toBe(true);
    expect(isGameModeEnabled(GameMode.SecretVillain)).toBe(true);
  });

  it("returns true for unreleased modes in test/dev environment", () => {
    expect(isGameModeEnabled(GameMode.Avalon)).toBe(true);
  });
});

describe("ENABLED_GAME_MODES", () => {
  it("includes all released modes", () => {
    expect(ENABLED_GAME_MODES).toContain(GameMode.Werewolf);
    expect(ENABLED_GAME_MODES).toContain(GameMode.SecretVillain);
  });

  it("includes unreleased modes in test/dev environment", () => {
    expect(ENABLED_GAME_MODES).toContain(GameMode.Avalon);
  });

  it("is sorted alphabetically by name", () => {
    const names = ENABLED_GAME_MODES.map((m) => GAME_MODES[m].name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });
});

describe("DEFAULT_GAME_MODE", () => {
  it("is a released mode", () => {
    expect(GAME_MODES[DEFAULT_GAME_MODE].released).toBe(true);
  });

  it("is the first alphabetical released mode", () => {
    const releasedModes = Object.values(GameMode)
      .filter((m) => GAME_MODES[m].released)
      .sort((a, b) => GAME_MODES[a].name.localeCompare(GAME_MODES[b].name));
    expect(DEFAULT_GAME_MODE).toBe(releasedModes[0]);
  });
});

describe("parseGameMode", () => {
  it("parses valid game mode strings", () => {
    expect(parseGameMode("werewolf")).toBe(GameMode.Werewolf);
    expect(parseGameMode("secret-villain")).toBe(GameMode.SecretVillain);
    expect(parseGameMode("avalon")).toBe(GameMode.Avalon);
  });

  it("returns undefined for invalid strings", () => {
    expect(parseGameMode("invalid")).toBeUndefined();
    expect(parseGameMode("")).toBeUndefined();
  });
});
