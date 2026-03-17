"use client";

import { useCallback } from "react";
import type { ActiveTrial } from "@/lib/game-modes/werewolf";
import { WEREWOLF_COPY, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { PublicLobbyPlayer } from "@/server/types/lobby";
import { useGameAction } from "@/hooks";
import { GameTimer } from "@/components/game";
import { Button } from "@/components/ui/button";

interface OwnerTrialPanelProps {
  gameId: string;
  activeTrial: ActiveTrial;
  players: PublicLobbyPlayer[];
  votePhaseSeconds: number | undefined;
}

export function OwnerTrialPanel({
  gameId,
  activeTrial,
  players,
  votePhaseSeconds,
}: OwnerTrialPanelProps) {
  const action = useGameAction(gameId);
  const defendant = players.find((p) => p.id === activeTrial.defendantId);
  const defendantName = defendant?.name ?? activeTrial.defendantId;
  const playerById = new Map(players.map((p) => [p.id, p]));

  const guiltyCount = activeTrial.votes.filter(
    (v) => v.vote === "guilty",
  ).length;
  const innocentCount = activeTrial.votes.filter(
    (v) => v.vote === "innocent",
  ).length;

  const handleResolve = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.ResolveTrial });
  }, [action]);

  const { trial } = WEREWOLF_COPY;
  const verdictLabel = activeTrial.verdict
    ? activeTrial.verdict === "eliminated"
      ? trial.verdictLabelEliminated
      : trial.verdictLabelInnocent
    : undefined;
  const trialStartedAt = new Date(activeTrial.startedAt);

  const content = verdictLabel ? (
    <>
      <p className="font-semibold mb-1">
        {trial.narratorVerdictHeading(defendantName, verdictLabel)}
      </p>
      <p className="text-sm text-muted-foreground">
        {trial.guiltyInnocentCount(guiltyCount, innocentCount)}
      </p>
    </>
  ) : (
    <>
      <p className="font-semibold mb-2">
        {trial.narratorTrialHeading(defendantName)}
      </p>
      <GameTimer
        durationSeconds={votePhaseSeconds}
        startedAt={trialStartedAt}
        onTimerTrigger={handleResolve}
        resetKey={activeTrial.startedAt}
      />
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
      <Button
        size="sm"
        className="w-full max-w-xs"
        onClick={handleResolve}
        disabled={action.isPending}
      >
        {trial.resolveTrial}
      </Button>
    </>
  );

  return <div className="mb-3 pb-3 border-b">{content}</div>;
}
