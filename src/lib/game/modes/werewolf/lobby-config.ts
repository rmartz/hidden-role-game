import { GameMode } from "@/lib/types";
import type { BaseLobbyConfig, Game } from "@/lib/types";
import type { WerewolfTimerConfig } from "./timer-config";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "./timer-config";

/** Werewolf-specific mode configuration. */
export interface WerewolfModeConfig {
  gameMode: GameMode.Werewolf;
  /** Whether player nominations for trial are enabled. */
  nominationsEnabled: boolean;
  /** When true, only one trial is allowed per day phase. */
  singleTrialPerDay: boolean;
  /** When true, the night summary reveals players who were attacked but saved by protection. */
  revealProtections: boolean;
  /** When true, a killed player's role is revealed during the game. */
  showRolesOnDeath?: boolean;
}

/** Werewolf-specific lobby configuration. */
export interface WerewolfLobbyConfig extends BaseLobbyConfig {
  gameMode: GameMode.Werewolf;
  timerConfig: WerewolfTimerConfig;
  modeConfig: WerewolfModeConfig;
}

export const DEFAULT_WEREWOLF_MODE_CONFIG: WerewolfModeConfig & {
  showRolesOnDeath: boolean;
} = {
  gameMode: GameMode.Werewolf,
  nominationsEnabled: true,
  singleTrialPerDay: true,
  revealProtections: true,
  showRolesOnDeath: true,
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
  return {
    gameMode: GameMode.Werewolf,
    nominationsEnabled:
      typeof raw["nominationsEnabled"] === "boolean"
        ? raw["nominationsEnabled"]
        : DEFAULT_WEREWOLF_MODE_CONFIG.nominationsEnabled,
    singleTrialPerDay:
      typeof raw["singleTrialPerDay"] === "boolean"
        ? raw["singleTrialPerDay"]
        : DEFAULT_WEREWOLF_MODE_CONFIG.singleTrialPerDay,
    revealProtections:
      typeof raw["revealProtections"] === "boolean"
        ? raw["revealProtections"]
        : DEFAULT_WEREWOLF_MODE_CONFIG.revealProtections,
    showRolesOnDeath:
      typeof raw["showRolesOnDeath"] === "boolean"
        ? raw["showRolesOnDeath"]
        : DEFAULT_WEREWOLF_MODE_CONFIG.showRolesOnDeath,
  };
}
