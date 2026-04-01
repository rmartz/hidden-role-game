"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";

interface ElectionVoteViewProps {
  presidentName: string;
  chancellorNomineeName: string;
  myVote?: "aye" | "no";
  onVote: (vote: "aye" | "no") => void;
  isPending?: boolean;
  isEliminated?: boolean;
}

export function ElectionVoteView({
  presidentName,
  chancellorNomineeName,
  myVote,
  onVote,
  isPending,
  isEliminated,
}: ElectionVoteViewProps) {
  const hasVoted = myVote !== undefined;

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

        {isEliminated ? (
          <p className="text-sm text-muted-foreground">
            {SECRET_VILLAIN_COPY.eliminated}
          </p>
        ) : hasVoted ? (
          <p className="text-sm text-muted-foreground">
            {SECRET_VILLAIN_COPY.election.alreadyVoted}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {SECRET_VILLAIN_COPY.election.castVote}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onVote("aye");
                }}
                disabled={!!isPending}
              >
                {SECRET_VILLAIN_COPY.election.aye}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onVote("no");
                }}
                disabled={!!isPending}
              >
                {SECRET_VILLAIN_COPY.election.no}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
