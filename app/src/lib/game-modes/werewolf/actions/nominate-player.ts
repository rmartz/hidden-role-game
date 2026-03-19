import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, getSilencedPlayerIds } from "../utils";
import { NOMINATION_VOTE_THRESHOLD } from "../constants";
import { startTrialAction } from "./start-trial";

export const nominatePlayerAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    // Only non-owner players can nominate
    if (!game.nominationsEnabled) return false;
    if (callerId === game.ownerPlayerId) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    // Cannot nominate while a trial is active and unresolved
    if (ts.phase.activeTrial && !ts.phase.activeTrial.verdict) return false;
    if (ts.deadPlayerIds.includes(callerId)) return false;
    // Silenced players cannot nominate
    const silencedIds = getSilencedPlayerIds(ts);
    if (silencedIds.includes(callerId)) return false;
    const { defendantId } = payload as { defendantId?: unknown };
    if (typeof defendantId !== "string") return false;
    // Cannot nominate yourself, the owner, or a dead player
    if (defendantId === callerId) return false;
    if (defendantId === game.ownerPlayerId) return false;
    if (ts.deadPlayerIds.includes(defendantId)) return false;
    // Caller must not already have an active nomination for the same defendant
    const existing = (ts.phase.nominations ?? []).find(
      (n) => n.nominatorId === callerId,
    );
    if (existing?.defendantId === defendantId) return false;
    return game.players.some((p) => p.id === defendantId);
  },
  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const { defendantId } = payload as { defendantId: string };

    // Remove any prior nomination by this caller
    const nominations = (ts.phase.nominations ?? []).filter(
      (n) => n.nominatorId !== callerId,
    );
    nominations.push({ nominatorId: callerId, defendantId });
    ts.phase.nominations = nominations;

    // Auto-start trial if threshold reached
    const count = nominations.filter(
      (n) => n.defendantId === defendantId,
    ).length;
    if (count >= NOMINATION_VOTE_THRESHOLD) {
      startTrialAction.apply(game, { defendantId }, callerId);
    }
  },
};
