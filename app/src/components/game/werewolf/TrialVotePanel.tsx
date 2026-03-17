"use client";

import { useCallback } from "react";
import type { DaytimeVote } from "@/lib/game-modes/werewolf";
import { WEREWOLF_COPY, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TrialVotePanelProps {
  gameId: string;
  activeTrial: NonNullable<PlayerGameState["activeTrial"]>;
  players: PlayerGameState["players"];
  myPlayerId?: string;
}

export function TrialVotePanel({
  gameId,
  activeTrial,
  players,
  myPlayerId,
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

  if (activeTrial.verdict) {
    const verdictLabel =
      activeTrial.verdict === "eliminated"
        ? trial.verdictLabelEliminated
        : trial.verdictLabelInnocent;
    return (
      <Card className="p-4 mb-4">
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
            <span className="font-medium">
              {activeTrial.eliminatedRole.name}
            </span>
            {trial.eliminatedRoleSuffix}
          </p>
        )}
      </Card>
    );
  }

  const isDefendant = myPlayerId === activeTrial.defendantId;
  const hasVoted = !!activeTrial.myVote;

  if (isDefendant) {
    return (
      <Card className="p-4 mb-4">
        <p className="font-semibold mb-1">{trial.youAreOnTrial}</p>
        <p className="text-sm text-muted-foreground">
          {trial.youAreOnTrialSubtext}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4">
      <p className="font-semibold mb-1">{trial.voteHeading(defendantName)}</p>
      <p className="text-sm text-muted-foreground mb-3">
        {trial.votesCast(activeTrial.voteCount, activeTrial.playerCount)}
        {hasVoted && activeTrial.myVote && trial.yourVote(activeTrial.myVote)}
      </p>
      {!hasVoted && (
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              castVote("guilty");
            }}
            disabled={action.isPending}
          >
            {trial.guiltyButton}
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              castVote("innocent");
            }}
            disabled={action.isPending}
          >
            {trial.innocentButton}
          </Button>
        </div>
      )}
    </Card>
  );
}
