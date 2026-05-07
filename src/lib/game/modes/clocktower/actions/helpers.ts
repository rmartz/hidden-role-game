import type { Game } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { ClocktowerPhase } from "../types";
import type { ClocktowerNightPhase, ClocktowerTurnState } from "../types";

export interface NightContext {
  ts: ClocktowerTurnState;
  phase: ClocktowerNightPhase;
}

/**
 * Returns the Clocktower turn state and narrowed night phase, or undefined
 * if the game is not currently in night phase.
 */
export function getNightContext(game: Game): NightContext | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  const ts = game.status.turnState as ClocktowerTurnState;
  if (ts.phase.type !== ClocktowerPhase.Night) return undefined;
  return { ts, phase: ts.phase };
}
