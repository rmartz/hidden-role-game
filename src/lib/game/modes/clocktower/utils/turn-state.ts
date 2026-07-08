import type { Game } from "@/lib/types";
import { GameStatus } from "@/lib/types";

import type { ClocktowerTurnState } from "../types";

/** Extracts the Clocktower turn state from a playing game, or undefined. */
export function currentTurnState(game: Game): ClocktowerTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as ClocktowerTurnState | undefined;
}
