import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";

export const smitePlayerAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    const { playerId } = payload as { playerId?: unknown };
    if (typeof playerId !== "string") return false;
    if (playerId === game.ownerPlayerId) return false;
    if (ts.deadPlayerIds.includes(playerId)) return false;
    if (ts.phase.type === WerewolfPhase.Nighttime) {
      if ((ts.phase.smitedPlayerIds ?? []).includes(playerId)) return false;
    } else {
      if ((ts.phase.pendingSmitePlayerIds ?? []).includes(playerId))
        return false;
    }
    return game.players.some((p) => p.id === playerId);
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const { playerId } = payload as { playerId: string };
    if (ts.phase.type === WerewolfPhase.Nighttime) {
      ts.phase.smitedPlayerIds = [
        ...(ts.phase.smitedPlayerIds ?? []),
        playerId,
      ];
    } else {
      ts.phase.pendingSmitePlayerIds = [
        ...(ts.phase.pendingSmitePlayerIds ?? []),
        playerId,
      ];
    }
  },
};
