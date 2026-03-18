"use client";

import { useCallback } from "react";
import type { DaytimeVote } from "@/lib/game-modes/werewolf";
import { WEREWOLF_COPY, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { GameTimer } from "@/components/game";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TrialVotePanelProps {
  gameId: string;
  activeTrial: NonNullable<PlayerGameState["activeTrial"]>;
  players: PlayerGameState["players"];
  myPlayerId?: string;
  amDead?: boolean;
  votePhaseSeconds: number;
  autoAdvance: boolean;
}

export function TrialVotePanel({
  gameId,
  activeTrial,
  players,
  myPlayerId,
  amDead,
  votePhaseSeconds,
  autoAdvance,
}: TrialVotePanelProps) {
  const action = useGameAction(gameId);
  const defendant = players.find((p) => p.id === activeTrial.defendantId);
  const defendantName = defendant?.name ?? activeTrial.defendantId;

  const castVote = useCallback(
    (vote: DaytimeVote) => {
      action.mutate({ actionId: WerewolfAction.CastVote, payload: { vote } });
    },
    [action],
  );

  const { trial } = WEREWOLF_COPY;
  const verdictLabel = activeTrial.verdict
    ? activeTrial.verdict === "eliminated"
      ? trial.verdictLabelEliminated
      : trial.verdictLabelInnocent
    : undefined;
  const isDefendant = myPlayerId === activeTrial.defendantId;
  const canVote = !amDead && !isDefendant;
  const hasVoted = !!activeTrial.myVote;
  const trialStartedAt = new Date(activeTrial.startedAt);
  const timer = (
    <GameTimer
      durationSeconds={votePhaseSeconds}
      autoAdvance={autoAdvance}
      startedAt={trialStartedAt}
      resetKey={activeTrial.startedAt}
    />
  );

  const cardContent = verdictLabel ? (
    <>
      <p className="font-semibold mb-2">
        <span className="font-bold">
          {trial.verdictHeading(defendantName, verdictLabel)}
        </span>
      </p>
      {activeTrial.voteResults && activeTrial.voteResults.length > 0 && (
        <ul className="text-sm text-muted-foreground mb-3 space-y-0.5">
          {activeTrial.voteResults.map((r) => (
            <li key={r.playerName}>
              {r.playerName}: {r.vote}
            </li>
          ))}
        </ul>
      )}
      {activeTrial.verdict === "eliminated" && activeTrial.eliminatedRole && (
        <p className="text-sm text-muted-foreground">
          {trial.eliminatedWereRole(defendantName)}{" "}
          <span className="font-medium">{activeTrial.eliminatedRole.name}</span>
          {trial.eliminatedRoleSuffix}
        </p>
      )}
    </>
  ) : isDefendant ? (
    <>
      <p className="font-semibold mb-1">{trial.youAreOnTrial}</p>
      <p className="text-sm text-muted-foreground mb-2">
        {trial.youAreOnTrialSubtext}
      </p>
      {timer}
    </>
  ) : (
    <>
      <p className="font-semibold mb-1">{trial.voteHeading(defendantName)}</p>
      {timer}
      <p className="text-sm text-muted-foreground mb-3 mt-2">
        {trial.votesCast(activeTrial.voteCount, activeTrial.playerCount)}
        {hasVoted && activeTrial.myVote && trial.yourVote(activeTrial.myVote)}
      </p>
      {activeTrial.mustVoteGuilty && hasVoted && (
        <p className="text-sm text-muted-foreground mb-3">
          {trial.mustVoteGuiltyNote}
        </p>
      )}
      {canVote && !hasVoted && (
        <div className="flex justify-center gap-4">
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              castVote("guilty");
            }}
            className="w-32"
            disabled={action.isPending}
          >
            {trial.guiltyButton}
          </Button>
          {!activeTrial.mustVoteGuilty && (
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                castVote("innocent");
              }}
              className="w-32"
              disabled={action.isPending}
            >
              {trial.innocentButton}
            </Button>
          )}
        </div>
      )}
    </>
  );

  return <Card className="p-4 mb-4">{cardContent}</Card>;
}
