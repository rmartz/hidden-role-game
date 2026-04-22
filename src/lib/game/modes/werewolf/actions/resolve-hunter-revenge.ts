import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying, checkWinCondition } from "../utils";
import { didWolfCubDie, cleanupAfterDaytimeKill } from "./helpers";

export const resolveHunterRevengeAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    if (!ts.hunterRevengePlayerId) return false;
    const { targetPlayerId } = payload as { targetPlayerId?: unknown };
    if (typeof targetPlayerId !== "string") return false;
    return !ts.deadPlayerIds.includes(targetPlayerId);
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;

    const { targetPlayerId } = payload as { targetPlayerId: string };
    ts.deadPlayerIds = [...ts.deadPlayerIds, targetPlayerId];

    if (didWolfCubDie([targetPlayerId], game)) {
      ts.wolfCubDied = true;
    }
    cleanupAfterDaytimeKill(targetPlayerId, ts, game);

    ts.hunterRevengePlayerId = undefined;

    const winResult = checkWinCondition(game, ts.deadPlayerIds);
    if (winResult) {
      game.status = winResult;
    }
  },
};
