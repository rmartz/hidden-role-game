"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import { GameTimer } from "@/components/game/GameTimer";

interface ElectionVoteViewProps {
  presidentName: string;
  chancellorNomineeName: string;
  myVote?: "aye" | "no";
  onVote: (vote: "aye" | "no") => void;
  /** Resolve the election (tally votes). */
  onResolve?: () => void;
  /** Whether all alive players have voted. */
  allVoted?: boolean;
  /** Timer duration in seconds (0 or undefined = no timer). */
  timerDurationSeconds?: number;
  /** When the vote phase started (for timer). */
  voteStartedAt?: Date;
  /** All players in the game (for voter status display). */
  players?: { id: string; name: string }[];
  /** Player IDs who have already voted. */
  votedPlayerIds?: string[];
  /** Player IDs who are eliminated (cannot vote). */
  eliminatedPlayerIds?: string[];
  isPending?: boolean;
  isEliminated?: boolean;
}

/** Max number of pending players to show by name. */
const PENDING_NAME_THRESHOLD = 3;

export function ElectionVoteView({
  presidentName,
  chancellorNomineeName,
  myVote,
  onVote,
  onResolve,
  allVoted,
  timerDurationSeconds,
  voteStartedAt,
  players,
  votedPlayerIds,
  eliminatedPlayerIds,
  isPending,
  isEliminated,
}: ElectionVoteViewProps) {
  const hasVoted = myVote !== undefined;
  const [timerExpired, setTimerExpired] = useState(false);
  const handleTimerExpired = useCallback(() => {
    setTimerExpired(true);
  }, []);
  const showTimer =
    timerDurationSeconds !== undefined &&
    timerDurationSeconds > 0 &&
    voteStartedAt !== undefined;
  const canResolve = allVoted === true || timerExpired;

  const votedSet = new Set(votedPlayerIds ?? []);
  const eliminatedSet = new Set(eliminatedPlayerIds ?? []);
  const pendingPlayers = (players ?? []).filter(
    (p) => !votedSet.has(p.id) && !eliminatedSet.has(p.id),
  );
  const waitingText =
    pendingPlayers.length > 0 && pendingPlayers.length <= PENDING_NAME_THRESHOLD
      ? SECRET_VILLAIN_COPY.election.waitingForPlayers(
          pendingPlayers.map((p) => p.name),
        )
      : SECRET_VILLAIN_COPY.election.alreadyVoted;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{SECRET_VILLAIN_COPY.election.voteHeading}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {SECRET_VILLAIN_COPY.election.voteInstructions(
            presidentName,
            chancellorNomineeName,
          )}
        </p>

        {showTimer && (
          <GameTimer
            durationSeconds={timerDurationSeconds}
            autoAdvance={false}
            startedAt={voteStartedAt}
            onTimerTrigger={handleTimerExpired}
          />
        )}

        {isEliminated ? (
          <p className="text-sm text-muted-foreground">
            {SECRET_VILLAIN_COPY.eliminated}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {SECRET_VILLAIN_COPY.election.castVote}
            </p>
            <div className="flex gap-2">
              <Button
                variant={myVote === "aye" ? "default" : "outline"}
                onClick={() => {
                  onVote("aye");
                }}
                disabled={!!isPending}
              >
                {SECRET_VILLAIN_COPY.election.aye}
              </Button>
              <Button
                variant={myVote === "no" ? "default" : "outline"}
                onClick={() => {
                  onVote("no");
                }}
                disabled={!!isPending}
              >
                {SECRET_VILLAIN_COPY.election.no}
              </Button>
            </div>
            {hasVoted && (
              <p className="text-sm text-muted-foreground">{waitingText}</p>
            )}
          </div>
        )}

        {canResolve && onResolve && (
          <Button onClick={onResolve} disabled={!!isPending} className="w-full">
            {SECRET_VILLAIN_COPY.election.resolveVote}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
