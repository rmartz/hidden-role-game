import type { Game, GameAction } from "@/lib/types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { didWolfCubDie, cleanupAfterDaytimeKill } from "./helpers";
import { WerewolfPhase } from "../types";

export const markPlayerDeadAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    const { playerId } = payload as { playerId?: unknown };
    if (typeof playerId !== "string") return false;
    if (playerId === game.ownerPlayerId) return false;
    if (ts.deadPlayerIds.includes(playerId)) return false;
    return game.players.some((p) => p.id === playerId);
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const { playerId } = payload as { playerId: string };
    ts.deadPlayerIds = [...ts.deadPlayerIds, playerId];
    if (didWolfCubDie([playerId], game)) {
      ts.wolfCubDied = true;
    }
    if (ts.phase.type === WerewolfPhase.Daytime) {
      cleanupAfterDaytimeKill(playerId, ts, game);
    }
  },
};

export const markPlayerAliveAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    const { playerId } = payload as { playerId?: unknown };
    if (typeof playerId !== "string") return false;
    return ts.deadPlayerIds.includes(playerId);
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const { playerId } = payload as { playerId: string };
    ts.deadPlayerIds = ts.deadPlayerIds.filter((id) => id !== playerId);
  },
};
