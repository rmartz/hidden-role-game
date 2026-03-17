"use client";

import { useCallback } from "react";
import type { DaytimeVote } from "@/lib/game-modes/werewolf";
import { WerewolfAction } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TrialVotePanelProps {
  gameId: string;
  activeTrial: NonNullable<PlayerGameState["activeTrial"]>;
  players: PlayerGameState["players"];
}

export function TrialVotePanel({
  gameId,
  activeTrial,
  players,
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

  if (activeTrial.verdict) {
    const verdictLabel =
      activeTrial.verdict === "eliminated" ? "Eliminated" : "Innocent";
    return (
      <Card className="p-4 mb-4">
        <p className="font-semibold mb-2">
          Verdict:{" "}
          <span className="font-bold">
            {defendantName} — {verdictLabel}
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
            {defendantName} was eliminated. They were a{" "}
            <span className="font-medium">
              {activeTrial.eliminatedRole.name}
            </span>
            .
          </p>
        )}
      </Card>
    );
  }

  const hasVoted = !!activeTrial.myVote;

  return (
    <Card className="p-4 mb-4">
      <p className="font-semibold mb-1">
        Vote: put <span className="font-bold">{defendantName}</span> on trial
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        {activeTrial.voteCount} of {activeTrial.playerCount} votes cast
        {hasVoted &&
          activeTrial.myVote &&
          ` · Your vote: ${activeTrial.myVote}`}
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
            Guilty
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              castVote("innocent");
            }}
            disabled={action.isPending}
          >
            Innocent
          </Button>
        </div>
      )}
    </Card>
  );
}
