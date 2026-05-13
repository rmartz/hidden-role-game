"use client";

import { useCallback } from "react";
import type { ActiveTrial } from "@/lib/game/modes/werewolf";
import {
  WEREWOLF_COPY,
  WerewolfAction,
  TrialVerdict,
  TrialPhase,
  DaytimeVote,
} from "@/lib/game/modes/werewolf";
import type { PublicLobbyPlayer } from "@/server/types/lobby";
import { useGameAction } from "@/hooks";
import { GameTimer } from "@/components/game";
import { Button } from "@/components/ui/button";

interface OwnerTrialPanelProps {
  gameId: string;
  activeTrial: ActiveTrial;
  players: PublicLobbyPlayer[];
  deadPlayerIds: string[];
  votePhaseSeconds: number;
  defensePhaseSeconds: number;
  autoAdvance: boolean;
  pendingGuiltId?: string;
  martyrUsed?: boolean;
}

export function OwnerTrialPanel({
  gameId,
  activeTrial,
  players,
  deadPlayerIds,
  votePhaseSeconds,
  defensePhaseSeconds,
  autoAdvance,
  pendingGuiltId,
  martyrUsed,
}: OwnerTrialPanelProps) {
  const action = useGameAction(gameId);
  const defendant = players.find((p) => p.id === activeTrial.defendantId);
  const defendantName = defendant?.name ?? activeTrial.defendantId;
  const playerById = new Map(players.map((p) => [p.id, p]));

  const guiltyCount = activeTrial.votes.filter(
    (v) => v.vote === DaytimeVote.Guilty,
  ).length;
  const innocentCount = activeTrial.votes.filter(
    (v) => v.vote === DaytimeVote.Innocent,
  ).length;

  const handleResolve = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.ResolveTrial });
  }, [action]);

  const handleAdvanceMartyrWindow = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.AdvanceMartyrWindow });
  }, [action]);

  const handleUseMartyrAbility = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.UseMartyrAbility });
  }, [action]);

  const handleSkipDefense = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.SkipDefense });
  }, [action]);

  const handleCancelTrial = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.CancelTrial });
  }, [action]);

  const handlePauseTimer = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.PauseTimer });
  }, [action]);

  const handleResumeTimer = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.ResumeTimer });
  }, [action]);

  const { trial, narrator } = WEREWOLF_COPY;
  const trialPausedAt =
    activeTrial.pausedAt !== undefined
      ? new Date(activeTrial.pausedAt)
      : undefined;
  const trialPauseOffset = activeTrial.pauseOffset ?? 0;
  const defendantSpared =
    activeTrial.verdict === TrialVerdict.Eliminated &&
    !pendingGuiltId &&
    !deadPlayerIds.includes(activeTrial.defendantId);
  const verdictLabel = activeTrial.verdict
    ? defendantSpared
      ? trial.verdictLabelSpared
      : activeTrial.verdict === TrialVerdict.Eliminated
        ? trial.verdictLabelEliminated
        : trial.verdictLabelInnocent
    : undefined;
  const trialStartedAt = new Date(activeTrial.startedAt);
  const voteTimerStartedAt = activeTrial.voteStartedAt
    ? new Date(activeTrial.voteStartedAt)
    : trialStartedAt;

  return (
    <div className="mb-3 pb-3 border-b">
      {verdictLabel ? (
        <>
          <p className="font-semibold mb-1">
            {trial.narratorVerdictHeading(defendantName, verdictLabel)}
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            {trial.guiltyInnocentCount(guiltyCount, innocentCount)}
          </p>
          {pendingGuiltId && (
            <div className="flex flex-col gap-2 mt-1">
              <Button
                size="sm"
                onClick={handleAdvanceMartyrWindow}
                disabled={action.isPending}
              >
                {trial.advanceToSentencing}
              </Button>
              {!martyrUsed && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleUseMartyrAbility}
                  disabled={action.isPending}
                >
                  {trial.narratorMartyrSacrificeButton}
                </Button>
              )}
            </div>
          )}
        </>
      ) : activeTrial.phase === TrialPhase.Defense ? (
        <>
          <p className="font-semibold mb-2">
            {trial.defenseHeading(defendantName)}
          </p>
          <div className="flex items-center gap-3 mb-2">
            <GameTimer
              durationSeconds={defensePhaseSeconds}
              autoAdvance={autoAdvance}
              startedAt={trialStartedAt}
              onTimerTrigger={handleSkipDefense}
              resetKey={activeTrial.startedAt}
              pausedAt={trialPausedAt}
              pauseOffset={trialPauseOffset}
            />
            {trialPausedAt !== undefined ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResumeTimer}
                disabled={action.isPending}
              >
                {narrator.resumeTimer}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePauseTimer}
                disabled={action.isPending}
              >
                {narrator.pauseTimer}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {trial.defenseSubtext}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleSkipDefense}
              disabled={action.isPending}
            >
              {trial.skipDefense}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelTrial}
              disabled={action.isPending}
            >
              {trial.cancelTrial}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="font-semibold mb-2">
            {trial.narratorTrialHeading(defendantName)}
          </p>
          <div className="flex items-center gap-3 mb-2">
            <GameTimer
              durationSeconds={votePhaseSeconds}
              autoAdvance={autoAdvance}
              startedAt={voteTimerStartedAt}
              onTimerTrigger={handleResolve}
              resetKey={activeTrial.voteStartedAt ?? activeTrial.startedAt}
              pausedAt={trialPausedAt}
              pauseOffset={trialPauseOffset}
            />
            {trialPausedAt !== undefined ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResumeTimer}
                disabled={action.isPending}
              >
                {narrator.resumeTimer}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePauseTimer}
                disabled={action.isPending}
              >
                {narrator.pauseTimer}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {trial.guiltyInnocentTotal(
              guiltyCount,
              innocentCount,
              activeTrial.votes.length,
            )}
          </p>
          {activeTrial.votes.length > 0 && (
            <ul className="text-sm text-muted-foreground mb-3 space-y-0.5">
              {activeTrial.votes.map((v) => (
                <li key={v.playerId}>
                  {playerById.get(v.playerId)?.name ?? v.playerId}: {v.vote}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleResolve}
              disabled={action.isPending}
            >
              {trial.revealTrialResults}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelTrial}
              disabled={action.isPending}
            >
              {trial.cancelTrial}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
