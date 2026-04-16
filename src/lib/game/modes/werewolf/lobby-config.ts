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
  /** When true, a killed player's role is revealed during the game. */
  showRolesOnDeath: boolean;
  /**
   * Number of roles to draw but not assign at game start. These are randomly
   * selected from the full role pool and revealed only to the Narrator.
   * A safety check prevents removing the last bad or neutral role.
   */
  hiddenRoleCount: number;
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
  // 2 allows a re-trial if the first ends in acquittal, without unlimited churn.
  trialsPerDay: 2,
  revealProtections: true,
  showRolesOnDeath: true,
  hiddenRoleCount: 0,
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
  const rawTrialsPerDay = raw["trialsPerDay"];
  const trialsPerDay =
    typeof rawTrialsPerDay === "number" &&
    Number.isFinite(rawTrialsPerDay) &&
    rawTrialsPerDay >= 0
      ? Math.floor(rawTrialsPerDay)
      : (legacySingleTrial ?? DEFAULT_WEREWOLF_MODE_CONFIG.trialsPerDay);
  return {
    gameMode: GameMode.Werewolf,
    nominationsEnabled:
      typeof raw["nominationsEnabled"] === "boolean"
        ? raw["nominationsEnabled"]
        : DEFAULT_WEREWOLF_MODE_CONFIG.nominationsEnabled,
    trialsPerDay,
    revealProtections:
      typeof raw["revealProtections"] === "boolean"
        ? raw["revealProtections"]
        : DEFAULT_WEREWOLF_MODE_CONFIG.revealProtections,
    showRolesOnDeath:
      typeof raw["showRolesOnDeath"] === "boolean"
        ? raw["showRolesOnDeath"]
        : DEFAULT_WEREWOLF_MODE_CONFIG.showRolesOnDeath,
    hiddenRoleCount:
      typeof raw["hiddenRoleCount"] === "number" &&
      Number.isInteger(raw["hiddenRoleCount"]) &&
      raw["hiddenRoleCount"] >= 0
        ? raw["hiddenRoleCount"]
        : DEFAULT_WEREWOLF_MODE_CONFIG.hiddenRoleCount,
  };
}
