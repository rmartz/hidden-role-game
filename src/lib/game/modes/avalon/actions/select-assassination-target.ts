import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { AvalonPhase } from "../types";
import type { AvalonTurnState } from "../types";

function currentTurnState(game: Game): AvalonTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as AvalonTurnState | undefined;
}

/**
 * The Assassin selects a target player they believe is Merlin.
 * The target is recorded but the assassination is not yet resolved.
 */
export const selectAssassinationTargetAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== AvalonPhase.Assassination) return false;
    // Only the Assassin may select a target
    if (ts.phase.assassinPlayerId !== callerId) return false;
    // Target cannot be changed once the assassination is resolved
    if (ts.phase.correct !== undefined) return false;

    const { targetPlayerId } = payload as { targetPlayerId?: unknown };
    if (typeof targetPlayerId !== "string") return false;
    // Target must be a valid player in the game
    return ts.leaderOrder.includes(targetPlayerId);
  },

  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== AvalonPhase.Assassination) return;

    const { targetPlayerId } = payload as { targetPlayerId: string };
    ts.phase.targetPlayerId = targetPlayerId;
  },
};
