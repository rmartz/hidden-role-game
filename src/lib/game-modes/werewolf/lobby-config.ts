import { GameMode } from "@/lib/types";
import type { Game, LobbyConfig } from "@/lib/types";
import type { WerewolfTimerConfig } from "./timer-config";

/** Werewolf-specific mode configuration. */
export interface WerewolfModeConfig {
  gameMode: GameMode.Werewolf;
  /** Whether player nominations for trial are enabled. */
  nominationsEnabled: boolean;
  /** When true, only one trial is allowed per day phase. */
  singleTrialPerDay: boolean;
  /** When true, the night summary reveals players who were attacked but saved by protection. */
  revealProtections: boolean;
}

/** Werewolf-specific lobby configuration. */
export interface WerewolfLobbyConfig extends LobbyConfig {
  timerConfig: WerewolfTimerConfig;
  modeConfig: WerewolfModeConfig;
}

export const DEFAULT_WEREWOLF_MODE_CONFIG: WerewolfModeConfig = {
  gameMode: GameMode.Werewolf,
  nominationsEnabled: true,
  singleTrialPerDay: true,
  revealProtections: true,
};

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
  };
}

/** Extract typed Werewolf mode config from a Game's modeConfig. */
export function getWerewolfModeConfig(game: Game): WerewolfModeConfig {
  return parseWerewolfModeConfig(
    game.modeConfig as unknown as Record<string, unknown>,
  );
}
