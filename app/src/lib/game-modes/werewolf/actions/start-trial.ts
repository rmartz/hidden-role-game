import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";

export const startTrialAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    if (ts.phase.activeTrial && !ts.phase.activeTrial.verdict) return false;
    const { defendantId } = payload as { defendantId?: unknown };
    if (typeof defendantId !== "string") return false;
    if (defendantId === game.ownerPlayerId) return false;
    if (ts.deadPlayerIds.includes(defendantId)) return false;
    return game.players.some((p) => p.id === defendantId);
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const { defendantId } = payload as { defendantId: string };
    ts.phase.activeTrial = {
      defendantId,
      startedAt: Date.now(),
      votes: [],
    };
  },
};
