import { GameMode, DEFAULT_TIMER_CONFIG } from "@/lib/types";
import type { BaseLobbyConfig, TimerConfig } from "@/lib/types";

/** Avalon-specific mode configuration (currently empty). */
export interface AvalonModeConfig {
  gameMode: GameMode.Avalon;
}

/** Avalon-specific lobby configuration. */
export interface AvalonLobbyConfig extends BaseLobbyConfig {
  gameMode: GameMode.Avalon;
  timerConfig: TimerConfig;
  modeConfig: AvalonModeConfig;
}

export const DEFAULT_AVALON_MODE_CONFIG: AvalonModeConfig = {
  gameMode: GameMode.Avalon,
};

export function buildDefaultAvalonLobbyConfig(
  base: BaseLobbyConfig,
): AvalonLobbyConfig {
  return {
    ...base,
    gameMode: GameMode.Avalon,
    timerConfig: DEFAULT_TIMER_CONFIG,
    modeConfig: DEFAULT_AVALON_MODE_CONFIG,
  };
}

export function parseAvalonModeConfig(): AvalonModeConfig {
  return { gameMode: GameMode.Avalon };
}
