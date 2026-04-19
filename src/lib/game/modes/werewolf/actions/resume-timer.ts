import type { Game, GameAction } from "@/lib/types";
import { currentTurnState, isOwnerPlaying } from "../utils";

export const resumeTimerAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    // Can only resume if currently paused
    return ts.phase.pausedAt !== undefined;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const { pausedAt, pauseOffset, startedAt } = ts.phase;
    if (pausedAt === undefined) return;
    // Accumulate elapsed time up to pausedAt, then clear the pause marker
    const additionalOffset = pausedAt - startedAt;
    ts.phase.pauseOffset = (pauseOffset ?? 0) + additionalOffset;
    ts.phase.pausedAt = undefined;
    // Shift startedAt forward so elapsed = pauseOffset + (now - startedAt) == prior elapsed
    ts.phase.startedAt = Date.now();
  },
};
