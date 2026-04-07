"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import { getSvThemeLabels } from "@/lib/game/modes/secret-villain/themes";
import type { SvTheme } from "@/lib/game/modes/secret-villain/themes";
import type {
  SvPowerTable,
  SpecialActionType,
} from "@/lib/game/modes/secret-villain/types";
import {
  GOOD_CARDS_TO_WIN,
  BAD_CARDS_TO_WIN,
} from "@/lib/game/modes/secret-villain/types";
import { cn } from "@/lib/utils";

interface BoardDisplayProps {
  goodCardsPlayed: number;
  badCardsPlayed: number;
  failedElectionCount: number;
  failedElectionThreshold: number;
  powerTable: SvPowerTable;
  vetoUnlocked?: boolean;
  svTheme?: SvTheme;
}

interface TrackSlotsProps {
  filled: number;
  size: number;
  variant: "good" | "bad";
  labels?: (string | undefined)[];
}

function slotClassName(
  isFilled: boolean,
  isFinal: boolean,
  variant: "good" | "bad",
): string {
  if (isFilled) {
    return isFinal
      ? variant === "good"
        ? "bg-green-300 border-green-400"
        : "bg-red-300 border-red-400"
      : variant === "good"
        ? "bg-green-500 border-green-600"
        : "bg-red-500 border-red-600";
  }
  return isFinal
    ? variant === "good"
      ? "border-green-300 border-dashed"
      : "border-red-300 border-dashed"
    : variant === "good"
      ? "border-green-400"
      : "border-red-400";
}

function TrackSlots({ filled, size, variant, labels }: TrackSlotsProps) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: size }, (_, i) => (
        <div key={i} className="relative">
          <div
            className={cn(
              "size-8 rounded border-2",
              slotClassName(i < filled, i === size - 1, variant),
            )}
            data-testid={`${variant}-slot-${String(i)}`}
            data-filled={i < filled}
            data-final={i === size - 1}
          />
          {labels?.[i] !== undefined && (
            <span
              className={cn(
                "absolute top-full left-1/2 text-xs leading-tight whitespace-nowrap origin-top-left rotate-45",
                i < filled
                  ? "text-muted-foreground line-through"
                  : i === filled
                    ? "font-medium"
                    : "text-muted-foreground/60",
              )}
              data-testid={`${variant}-slot-label-${String(i)}`}
            >
              {labels[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function resolvePowerLabels(powerTable: SvPowerTable): (string | undefined)[] {
  const labels = SECRET_VILLAIN_COPY.board.powerLabels as Record<
    SpecialActionType,
    string
  >;
  return powerTable.map((action) =>
    action !== undefined ? labels[action] : undefined,
  );
}

export function BoardDisplay({
  goodCardsPlayed,
  badCardsPlayed,
  failedElectionCount,
  failedElectionThreshold,
  powerTable,
  vetoUnlocked,
  svTheme,
}: BoardDisplayProps) {
  const themeLabels = getSvThemeLabels(svTheme);
  const powerLabels = resolvePowerLabels(powerTable);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{themeLabels.goodTrack}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TrackSlots
          filled={goodCardsPlayed}
          size={GOOD_CARDS_TO_WIN}
          variant="good"
        />

        <div className="pb-16">
          <p className="text-sm font-medium mb-1">{themeLabels.badTrack}</p>
          <TrackSlots
            filled={badCardsPlayed}
            size={BAD_CARDS_TO_WIN}
            variant="bad"
            labels={powerLabels}
          />
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
