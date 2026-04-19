import { GameMode, DEFAULT_TIMER_CONFIG } from "@/lib/types";
import type { BaseLobbyConfig, TimerConfig } from "@/lib/types";

/** Clocktower-specific mode configuration. */
export interface ClocktowerModeConfig {
  gameMode: GameMode.Clocktower;
}

/** Clocktower-specific lobby configuration. */
export interface ClocktowerLobbyConfig extends BaseLobbyConfig {
  gameMode: GameMode.Clocktower;
  timerConfig: TimerConfig;
  modeConfig: ClocktowerModeConfig;
}

export const DEFAULT_CLOCKTOWER_MODE_CONFIG: ClocktowerModeConfig = {
  gameMode: GameMode.Clocktower,
};

export function buildDefaultClocktowerLobbyConfig(
  base: BaseLobbyConfig,
): ClocktowerLobbyConfig {
  return {
    ...base,
    gameMode: GameMode.Clocktower,
    timerConfig: DEFAULT_TIMER_CONFIG,
    modeConfig: DEFAULT_CLOCKTOWER_MODE_CONFIG,
  };
}

export function parseClocktowerModeConfig(): ClocktowerModeConfig {
  return { gameMode: GameMode.Clocktower };
}
