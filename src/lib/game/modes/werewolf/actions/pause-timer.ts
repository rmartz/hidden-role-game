import type { Game, GameAction } from "@/lib/types";
import { currentTurnState, isOwnerPlaying } from "../utils";

export const pauseTimerAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    // Cannot pause if already paused
    return ts.phase.pausedAt === undefined;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    ts.phase.pausedAt = Date.now();
  },
};
