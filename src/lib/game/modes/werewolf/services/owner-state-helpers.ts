import type { Game } from "@/lib/types";

import type { AnyNightAction } from "../types";
import { WerewolfPhase } from "../types";
import { currentTurnState } from "../utils/game-state";

/** Returns the set of player IDs whose night outcomes are publicly visible. */
export function resolveRevealedPlayerIds(game: Game): Set<string> {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== WerewolfPhase.Daytime) return new Set();
  return new Set(ts.phase.revealedPlayerIds ?? []);
}

/** Extracts nightActions from the current turnState, if present. */
export function extractNightActions(
  game: Game,
): Record<string, AnyNightAction> | undefined {
  const ts = currentTurnState(game);
  if (!ts) return undefined;
  const { nightActions } = ts.phase;
  if (ts.phase.type === WerewolfPhase.Nighttime) return nightActions;
  return Object.keys(nightActions).length > 0 ? nightActions : undefined;
}

/** Extracts deadPlayerIds from the Werewolf turn state. */
export function extractDeadPlayerIds(game: Game): string[] {
  const ts = currentTurnState(game);
  return ts?.deadPlayerIds ?? [];
}

/** Extracts the Hunter revenge player ID (narrator-only). */
export function extractHunterRevengePlayerId(game: Game): string | undefined {
  const ts = currentTurnState(game);
  return ts?.roleState?.hunter?.revengePlayerId;
}
