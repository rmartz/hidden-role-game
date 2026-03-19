import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfNighttimePhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";

export const smitePlayerAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Nighttime) return false;
    const { playerId } = payload as { playerId?: unknown };
    if (typeof playerId !== "string") return false;
    if (playerId === game.ownerPlayerId) return false;
    if (ts.deadPlayerIds.includes(playerId)) return false;
    const smitedIds = ts.phase.smitedPlayerIds ?? [];
    if (smitedIds.includes(playerId)) return false;
    return game.players.some((p) => p.id === playerId);
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const nightPhase = ts.phase as WerewolfNighttimePhase;
    const { playerId } = payload as { playerId: string };
    nightPhase.smitedPlayerIds = [
      ...(nightPhase.smitedPlayerIds ?? []),
      playerId,
    ];
  },
};
