import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, TrialPhase } from "../types";
import type { ActiveTrial } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";

function resumeTrialTimer(activeTrial: ActiveTrial): void {
  const { pausedAt, pauseOffset } = activeTrial;
  if (pausedAt === undefined) return;
  const timerStartedAt =
    activeTrial.phase === TrialPhase.Voting &&
    activeTrial.voteStartedAt !== undefined
      ? activeTrial.voteStartedAt
      : activeTrial.startedAt;
  const additionalOffset = pausedAt - timerStartedAt;
  activeTrial.pauseOffset = (pauseOffset ?? 0) + additionalOffset;
  activeTrial.pausedAt = undefined;
  const now = Date.now();
  if (
    activeTrial.phase === TrialPhase.Voting &&
    activeTrial.voteStartedAt !== undefined
  ) {
    activeTrial.voteStartedAt = now;
  } else {
    activeTrial.startedAt = now;
  }
}

export const resumeTimerAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (
      ts.phase.type === WerewolfPhase.Daytime &&
      ts.phase.activeTrial &&
      !ts.phase.activeTrial.verdict
    ) {
      // Can only resume trial timer if currently paused
      return ts.phase.activeTrial.pausedAt !== undefined;
    }
    // Can only resume phase timer if currently paused
    return ts.phase.pausedAt !== undefined;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    if (
      ts.phase.type === WerewolfPhase.Daytime &&
      ts.phase.activeTrial &&
      !ts.phase.activeTrial.verdict
    ) {
      resumeTrialTimer(ts.phase.activeTrial);
      return;
    }
    const { pausedAt, pauseOffset, startedAt } = ts.phase;
    if (pausedAt === undefined) return;
    // Accumulate elapsed time up to pausedAt, then clear the pause marker
    const additionalOffset = pausedAt - startedAt;
    ts.phase.pauseOffset = (pauseOffset ?? 0) + additionalOffset;
    ts.phase.pausedAt = undefined;
    // Shift startedAt forward so elapsed = pauseOffset + (now - startedAt) == prior elapsed
    ts.phase.startedAt = Date.now();
  },
};
