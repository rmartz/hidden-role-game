"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";
import { cn } from "@/lib/utils";

interface BoardDisplayProps {
  goodCardsPlayed: number;
  badCardsPlayed: number;
  failedElectionCount: number;
  failedElectionThreshold: number;
  vetoUnlocked?: boolean;
}

const TRACK_SIZE = 5;

function TrackSlots({
  filled,
  variant,
}: {
  filled: number;
  variant: "good" | "bad";
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: TRACK_SIZE }, (_, i) => (
        <div
          key={i}
          className={cn(
            "size-8 rounded border-2",
            i < filled
              ? variant === "good"
                ? "bg-green-500 border-green-600"
                : "bg-red-500 border-red-600"
              : variant === "good"
                ? "border-green-400"
                : "border-red-400",
          )}
          data-testid={`${variant}-slot-${String(i)}`}
          data-filled={i < filled}
        />
      ))}
    </div>
  );
}

export function BoardDisplay({
  goodCardsPlayed,
  badCardsPlayed,
  failedElectionCount,
  failedElectionThreshold,
  vetoUnlocked,
}: BoardDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{SECRET_VILLAIN_COPY.board.goodTrack}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TrackSlots filled={goodCardsPlayed} variant="good" />

        <div>
          <p className="text-sm font-medium mb-1">
            {SECRET_VILLAIN_COPY.board.badTrack}
          </p>
          <TrackSlots filled={badCardsPlayed} variant="bad" />
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            {SECRET_VILLAIN_COPY.board.failedElections}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: failedElectionThreshold }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "size-3 rounded-full",
                  i < failedElectionCount
                    ? "bg-yellow-500"
                    : "bg-muted-foreground/30",
                )}
                data-testid={`election-dot-${String(i)}`}
                data-filled={i < failedElectionCount}
              />
            ))}
          </div>
        </div>

        {vetoUnlocked && (
          <Badge variant="secondary" data-testid="veto-badge">
            {SECRET_VILLAIN_COPY.board.vetoUnlocked}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
