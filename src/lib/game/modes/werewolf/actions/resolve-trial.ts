import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import type { ActiveTrial, WerewolfTurnState } from "../types";
import { TrialVerdict, WerewolfPhase, TrialPhase, DaytimeVote } from "../types";
import {
  currentTurnState,
  isOwnerPlaying,
  checkWinCondition,
  WerewolfWinner,
} from "../utils";
import { WerewolfRole } from "../roles";
import { didWolfCubDie, cleanupAfterDaytimeKill } from "./helpers";

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

  // Mayor's vote counts double (secret — extra vote added to their side)
  for (const v of activeTrial.votes) {
    const roleId = game.roleAssignments.find(
      (a) => a.playerId === v.playerId,
    )?.roleDefinitionId;
    if (roleId === WerewolfRole.Mayor) {
      if (v.vote === DaytimeVote.Guilty) guiltyCount++;
      else innocentCount++;
    }
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

  if (eliminated) {
    const { defendantId } = activeTrial;
    if (!ts.deadPlayerIds.includes(defendantId)) {
      ts.deadPlayerIds = [...ts.deadPlayerIds, defendantId];
      if (didWolfCubDie([defendantId], game)) {
        ts.wolfCubDied = true;
      }
      cleanupAfterDaytimeKill(defendantId, ts, game);
    }
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

    if (activeTrial.verdict === TrialVerdict.Eliminated) {
      const { defendantId } = activeTrial;

      // Executioner wins if their target was eliminated and the Executioner is alive.
      // Check Executioner before Tanner (if target is also the Tanner, Executioner wins).
      if (ts.executionerTargetId === defendantId) {
        const executionerAssignment = game.roleAssignments.find(
          (a) => a.roleDefinitionId === (WerewolfRole.Executioner as string),
        );
        const executionerAlive =
          executionerAssignment !== undefined &&
          !ts.deadPlayerIds.includes(executionerAssignment.playerId);
        if (executionerAlive) {
          game.status = {
            type: GameStatus.Finished,
            winner: WerewolfWinner.Executioner,
          };
          return;
        }
      }

      // Tanner wins immediately if eliminated at trial.
      const tannerAssignment = game.roleAssignments.find(
        (a) => a.roleDefinitionId === (WerewolfRole.Tanner as string),
      );
      if (tannerAssignment?.playerId === defendantId) {
        game.status = {
          type: GameStatus.Finished,
          winner: WerewolfWinner.Tanner,
        };
        return;
      }

      // Hunter revenge: if the eliminated player is the Hunter, defer win check.
      const eliminatedRole = game.roleAssignments.find(
        (a) => a.playerId === defendantId,
      )?.roleDefinitionId;
      if (eliminatedRole === (WerewolfRole.Hunter as string)) {
        ts.hunterRevengePlayerId = defendantId;
        return;
      }
    }

    const winResult = checkWinCondition(game, ts.deadPlayerIds);
    if (winResult) {
      game.status = winResult;
    }
  },
};
