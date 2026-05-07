import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, TrialPhase, TrialVerdict } from "../types";
import { currentTurnState, isOwnerPlaying, checkWinCondition } from "../utils";
import { applyTrialVerdict } from "./resolve-trial";

export const skipDefenseAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    const { activeTrial } = ts.phase;
    if (!activeTrial) return false;
    return activeTrial.phase === TrialPhase.Defense;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const { activeTrial } = ts.phase;
    if (!activeTrial) return;

    activeTrial.phase = TrialPhase.Voting;
    activeTrial.voteStartedAt = Date.now();

    // Auto-resolve if precast votes already cover all eligible voters
    const eligibleCount = game.players.filter(
      (p) =>
        p.id !== game.ownerPlayerId &&
        p.id !== activeTrial.defendantId &&
        !ts.deadPlayerIds.includes(p.id),
    ).length;
    if (activeTrial.votes.length >= eligibleCount) {
      applyTrialVerdict(activeTrial, ts, game);
      // Guilty verdict: pendingGuiltId is now set; narrator must advance the
      // Martyr window before the death is applied.
      // Innocent verdict: no pending death — check win condition directly.
      if (activeTrial.verdict !== TrialVerdict.Eliminated) {
        const winResult = checkWinCondition(game, ts.deadPlayerIds);
        if (winResult) {
          game.status = winResult;
        }
      }
    }
  },
};
