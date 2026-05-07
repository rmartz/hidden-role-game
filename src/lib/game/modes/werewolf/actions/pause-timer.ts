import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";

export const pauseTimerAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (
      ts.phase.type === WerewolfPhase.Daytime &&
      ts.phase.activeTrial &&
      !ts.phase.activeTrial.verdict
    ) {
      // Cannot pause trial timer if already paused
      return ts.phase.activeTrial.pausedAt === undefined;
    }
    // Cannot pause phase timer if already paused
    return ts.phase.pausedAt === undefined;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    if (
      ts.phase.type === WerewolfPhase.Daytime &&
      ts.phase.activeTrial &&
      !ts.phase.activeTrial.verdict
    ) {
      ts.phase.activeTrial.pausedAt = Date.now();
      return;
    }
    ts.phase.pausedAt = Date.now();
  },
};
