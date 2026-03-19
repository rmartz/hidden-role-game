import { GameStatus } from "@/lib/types";
import type { Game } from "@/lib/types";
import type {
  WerewolfTurnState,
  HypnotizedNightResolutionEvent,
} from "../types";
import { WerewolfPhase } from "../types";

export function isOwnerPlaying(game: Game, callerId: string): boolean {
  return (
    callerId === game.ownerPlayerId && game.status.type === GameStatus.Playing
  );
}

export function currentTurnState(game: Game): WerewolfTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as WerewolfTurnState | undefined;
}

/** Returns player IDs silenced by the Spellcaster during the preceding night. */
export function getSilencedPlayerIds(ts: WerewolfTurnState): string[] {
  if (ts.phase.type !== WerewolfPhase.Daytime) return [];
  return (ts.phase.nightResolution ?? [])
    .filter((e) => e.type === "silenced")
    .map((e) => e.targetPlayerId);
}

/** Returns the player ID hypnotized by the Mummy during the preceding night, if any.
 * Returns undefined if the Mummy has since died, lifting the hypnosis. */
export function getHypnotizedPlayerId(
  ts: WerewolfTurnState,
): string | undefined {
  if (ts.phase.type !== WerewolfPhase.Daytime) return undefined;
  const event = (ts.phase.nightResolution ?? []).find(
    (e): e is HypnotizedNightResolutionEvent => e.type === "hypnotized",
  );
  if (!event) return undefined;
  if (ts.deadPlayerIds.includes(event.mummyPlayerId)) return undefined;
  return event.targetPlayerId;
}
