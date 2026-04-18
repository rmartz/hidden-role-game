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
    switch (ts.phase.type) {
      case WerewolfPhase.Nighttime:
        return (ts.phase.smitedPlayerIds ?? []).includes(playerId);
      case WerewolfPhase.Daytime:
        return (ts.phase.pendingSmitePlayerIds ?? []).includes(playerId);
      default:
        return false;
    }
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const { playerId } = payload as { playerId: string };
    switch (ts.phase.type) {
      case WerewolfPhase.Nighttime:
        ts.phase.smitedPlayerIds = (ts.phase.smitedPlayerIds ?? []).filter(
          (id) => id !== playerId,
        );
        break;
      case WerewolfPhase.Daytime:
        ts.phase.pendingSmitePlayerIds = (
          ts.phase.pendingSmitePlayerIds ?? []
        ).filter((id) => id !== playerId);
        break;
    }
  },
};
