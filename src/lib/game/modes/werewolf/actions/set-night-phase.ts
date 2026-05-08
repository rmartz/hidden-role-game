import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfNighttimePhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";

export const setNightPhaseAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
    const { phaseIndex } = payload as { phaseIndex?: unknown };
    return (
      typeof phaseIndex === "number" &&
      phaseIndex >= 0 &&
      phaseIndex < ts.phase.nightPhaseOrder.length
    );
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const { phaseIndex } = payload as { phaseIndex: number };
    const phase = ts.phase as WerewolfNighttimePhase;
    game.status = {
      type: GameStatus.Playing,
      turnState: {
        ...ts,
        phase: {
          ...phase,
          currentPhaseIndex: phaseIndex,
          startedAt: Date.now(),
          pausedAt: undefined,
          pauseOffset: undefined,
        },
      },
    };
  },
};
