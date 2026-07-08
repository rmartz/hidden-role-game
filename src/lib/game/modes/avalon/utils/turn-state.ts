import type { Game } from "@/lib/types";
import { GameStatus } from "@/lib/types";

import type { AvalonTurnState } from "../types";

/** Extracts the Avalon turn state from a playing game, or undefined. */
export function currentTurnState(game: Game): AvalonTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as AvalonTurnState | undefined;
}
