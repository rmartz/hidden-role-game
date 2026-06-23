import type { GameMode } from "@/lib/types";

import { GAME_MODES } from "./modes";

export const DEFAULT_THEME = "twilight_modern";

/** Returns the CSS theme identifier for a game mode, falling back to `"twilight_modern"`. */
export function resolveGameModeTheme(gameMode: GameMode | undefined): string {
  if (gameMode === undefined) return DEFAULT_THEME;
  return GAME_MODES[gameMode].theme ?? DEFAULT_THEME;
}
