import { GameMode } from "@/lib/types";

/** Avalon-specific mode configuration (currently empty). */
export interface AvalonModeConfig {
  gameMode: GameMode.Avalon;
}

export const DEFAULT_AVALON_MODE_CONFIG: AvalonModeConfig = {
  gameMode: GameMode.Avalon,
};

export function parseAvalonModeConfig(): AvalonModeConfig {
  return { gameMode: GameMode.Avalon };
}
