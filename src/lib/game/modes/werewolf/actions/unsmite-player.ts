import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";

export const unsmitePlayerAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    const { playerId } = payload as { playerId?: unknown };
    if (typeof playerId !== "string") return false;
    if (ts.phase.type === WerewolfPhase.Nighttime) {
      return (ts.phase.smitedPlayerIds ?? []).includes(playerId);
    }
    return (ts.phase.pendingSmitePlayerIds ?? []).includes(playerId);
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const { playerId } = payload as { playerId: string };
    if (ts.phase.type === WerewolfPhase.Nighttime) {
      ts.phase.smitedPlayerIds = (ts.phase.smitedPlayerIds ?? []).filter(
        (id) => id !== playerId,
      );
    } else {
      ts.phase.pendingSmitePlayerIds = (
        ts.phase.pendingSmitePlayerIds ?? []
      ).filter((id) => id !== playerId);
    }
  },
};
