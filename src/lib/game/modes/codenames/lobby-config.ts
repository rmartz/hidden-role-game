import { GameMode, DEFAULT_TIMER_CONFIG } from "@/lib/types";
import type { BaseLobbyConfig, TimerConfig } from "@/lib/types";

/** Codenames-specific mode configuration (currently empty). */
export interface CodenamesModeConfig {
  gameMode: GameMode.Codenames;
}

/** Codenames-specific lobby configuration. */
export interface CodenamesLobbyConfig extends BaseLobbyConfig {
  gameMode: GameMode.Codenames;
  timerConfig: TimerConfig;
  modeConfig: CodenamesModeConfig;
}

export const DEFAULT_CODENAMES_MODE_CONFIG: CodenamesModeConfig = {
  gameMode: GameMode.Codenames,
};

export function buildDefaultCodenamesLobbyConfig(
  base: BaseLobbyConfig,
): CodenamesLobbyConfig {
  return {
    ...base,
    gameMode: GameMode.Codenames,
    timerConfig: DEFAULT_TIMER_CONFIG,
    modeConfig: DEFAULT_CODENAMES_MODE_CONFIG,
  };
}

export function parseCodenamesModeConfig(): CodenamesModeConfig {
  return { gameMode: GameMode.Codenames };
}
