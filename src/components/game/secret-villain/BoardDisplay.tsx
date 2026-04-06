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
import { cn } from "@/lib/utils";

interface BoardDisplayProps {
  goodCardsPlayed: number;
  badCardsPlayed: number;
  failedElectionCount: number;
  failedElectionThreshold: number;
  powerTable?: SvPowerTable;
  vetoUnlocked?: boolean;
  svTheme?: SvTheme;
}

const TRACK_SIZE = 5;

interface TrackSlotsProps {
  filled: number;
  variant: "good" | "bad";
  labels?: (string | undefined)[];
}

function TrackSlots({ filled, variant, labels }: TrackSlotsProps) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: TRACK_SIZE }, (_, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
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
          {labels?.[i] !== undefined && (
            <span
              className={cn(
                "text-xs text-center leading-tight w-10",
                i < filled
                  ? "text-muted-foreground line-through"
                  : i === filled
                    ? "font-medium"
                    : "text-muted-foreground/60",
              )}
              data-testid={`bad-slot-label-${String(i)}`}
            >
              {labels[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function resolvePowerLabels(
  powerTable: SvPowerTable | undefined,
): (string | undefined)[] | undefined {
  if (!powerTable) return undefined;
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
        <TrackSlots filled={goodCardsPlayed} variant="good" />

        <div>
          <p className="text-sm font-medium mb-1">{themeLabels.badTrack}</p>
          <TrackSlots
            filled={badCardsPlayed}
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
