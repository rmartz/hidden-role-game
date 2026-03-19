import { GameStatus } from "@/lib/types";
import type { Game } from "@/lib/types";
import type { WerewolfTurnState } from "../types";
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
