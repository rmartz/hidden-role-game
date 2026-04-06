import { GameMode } from "@/lib/types";
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

export function parseAvalonModeConfig(): AvalonModeConfig {
  return { gameMode: GameMode.Avalon };
}
