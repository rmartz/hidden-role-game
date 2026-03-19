import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying, checkWinCondition } from "../utils";
import { didWolfCubDie } from "./helpers";

export const killPlayerAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
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
    const winResult = checkWinCondition(game, ts.deadPlayerIds);
    if (winResult) {
      game.status = winResult;
    }
  },
};
