import type { Game, GameAction } from "@/lib/types";
import type { ActiveTrial, WerewolfTurnState } from "../types";
import { TrialVerdict, WerewolfPhase, TrialPhase, DaytimeVote } from "../types";
import { currentTurnState, isOwnerPlaying, checkWinCondition } from "../utils";
import { WerewolfRole } from "../roles";

export function applyTrialVerdict(
  activeTrial: ActiveTrial,
  ts: WerewolfTurnState,
  game: Game,
) {
  let guiltyCount = activeTrial.votes.filter(
    (v) => v.vote === DaytimeVote.Guilty,
  ).length;
  let innocentCount = activeTrial.votes.filter(
    (v) => v.vote === DaytimeVote.Innocent,
  ).length;

  // Extra trial vote weight: Mayor gets +1 and each Monarch-knighted voter gets +1.
  for (const v of activeTrial.votes) {
    const roleId = game.roleAssignments.find(
      (a) => a.playerId === v.playerId,
    )?.roleDefinitionId;
    const extraVoteWeight =
      Number(roleId === WerewolfRole.Mayor) +
      Number((ts.monarchKnightedPlayerIds ?? []).includes(v.playerId));
    if (extraVoteWeight === 0) continue;
    if (v.vote === DaytimeVote.Guilty) guiltyCount += extraVoteWeight;
    else innocentCount += extraVoteWeight;
  }

  // Strictly more Guilty than Innocent → eliminated; ties/abstentions → innocent
  const eliminated = guiltyCount > innocentCount;
  activeTrial.verdict = eliminated
    ? TrialVerdict.Eliminated
    : TrialVerdict.Innocent;

  // Increment the concluded-trials counter. Done here so all paths that call
  // applyTrialVerdict (resolveTrialAction, castVoteAction auto-resolve,
  // skipDefenseAction auto-resolve) are counted consistently.
  if (ts.phase.type === WerewolfPhase.Daytime) {
    ts.phase.concludedTrialsCount = (ts.phase.concludedTrialsCount ?? 0) + 1;
  }

  if (eliminated && ts.phase.type === WerewolfPhase.Daytime) {
    // Store the convicted player ID as pending; actual death is deferred to
    // AdvanceMartyrWindow so the narrator can reveal the role (and the Martyr
    // may optionally intervene) before the player is formally eliminated.
    ts.phase.pendingGuiltId = activeTrial.defendantId;
  }
}

export const resolveTrialAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    const { activeTrial } = ts.phase;
    if (!activeTrial) return false;
    if (activeTrial.phase !== TrialPhase.Voting) return false;
    return !activeTrial.verdict;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const { activeTrial } = ts.phase;
    if (!activeTrial) return;
    applyTrialVerdict(activeTrial, ts, game);

    // Guilty verdict: pendingGuiltId is now set; narrator must call
    // AdvanceMartyrWindow to apply the death (enabling the Martyr window).
    // Innocent verdict: no pending death — check win condition directly.
    if (activeTrial.verdict !== TrialVerdict.Eliminated) {
      const winResult = checkWinCondition(game, ts.deadPlayerIds);
      if (winResult) {
        game.status = winResult;
      }
    }
  },
};
