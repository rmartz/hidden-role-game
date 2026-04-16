import { GameMode } from "@/lib/types";
import type { BaseLobbyConfig, Game } from "@/lib/types";
import type { WerewolfTimerConfig } from "./timer-config";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "./timer-config";

/** Werewolf-specific mode configuration. */
export interface WerewolfModeConfig {
  gameMode: GameMode.Werewolf;
  /** Whether player nominations for trial are enabled. */
  nominationsEnabled: boolean;
  /** Maximum number of trials allowed per day phase. 0 means unlimited. */
  trialsPerDay: number;
  /** When true, the night summary reveals players who were attacked but saved by protection. */
  revealProtections: boolean;
}

/** Werewolf-specific lobby configuration. */
export interface WerewolfLobbyConfig extends BaseLobbyConfig {
  gameMode: GameMode.Werewolf;
  timerConfig: WerewolfTimerConfig;
  modeConfig: WerewolfModeConfig;
}

export const DEFAULT_WEREWOLF_MODE_CONFIG: WerewolfModeConfig = {
  gameMode: GameMode.Werewolf,
  nominationsEnabled: true,
  trialsPerDay: 2,
  revealProtections: true,
};

/**
 * Extract the WerewolfModeConfig from a Game, asserting the game is Werewolf.
 * Safe to call from werewolf-specific code that only runs for Werewolf games.
 */
export function getWerewolfModeConfig(game: Game): WerewolfModeConfig {
  return game.modeConfig as WerewolfModeConfig;
}

export function buildDefaultWerewolfLobbyConfig(
  base: BaseLobbyConfig,
): WerewolfLobbyConfig {
  return {
    ...base,
    gameMode: GameMode.Werewolf,
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    modeConfig: DEFAULT_WEREWOLF_MODE_CONFIG,
  };
}

export function parseWerewolfModeConfig(
  raw: Record<string, unknown>,
): WerewolfModeConfig {
  // Backward-compat: old config used a boolean `singleTrialPerDay` (true = 1 trial/day).
  const legacySingleTrial =
    typeof raw["singleTrialPerDay"] === "boolean"
      ? raw["singleTrialPerDay"]
        ? 1
        : 0
      : undefined;
  return {
    gameMode: GameMode.Werewolf,
    nominationsEnabled:
      typeof raw["nominationsEnabled"] === "boolean"
        ? raw["nominationsEnabled"]
        : DEFAULT_WEREWOLF_MODE_CONFIG.nominationsEnabled,
    trialsPerDay:
      typeof raw["trialsPerDay"] === "number"
        ? raw["trialsPerDay"]
        : (legacySingleTrial ?? DEFAULT_WEREWOLF_MODE_CONFIG.trialsPerDay),
    revealProtections:
      typeof raw["revealProtections"] === "boolean"
        ? raw["revealProtections"]
        : DEFAULT_WEREWOLF_MODE_CONFIG.revealProtections,
  };
}
