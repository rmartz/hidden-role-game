"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import type { SvTheme } from "@/lib/game/modes/secret-villain/themes";
import { PolicyCardTable } from "./PolicyCardTable";

interface PolicyChancellorViewProps {
  remainingCards: string[];
  selectedIndex?: number;
  onSelectCard: (index: number) => void;
  onPlay: () => void;
  vetoUnlocked?: boolean;
  vetoProposed?: boolean;
  vetoResponse?: boolean;
  onProposeVeto?: () => void;
  isPending?: boolean;
  isChancellor: boolean;
  chancellorName: string;
  svTheme?: SvTheme;
}

export function PolicyChancellorView({
  remainingCards,
  selectedIndex,
  onSelectCard,
  onPlay,
  vetoUnlocked,
  vetoProposed,
  vetoResponse,
  onProposeVeto,
  isPending,
  isChancellor,
  chancellorName,
  svTheme,
}: PolicyChancellorViewProps) {
  if (!isChancellor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{SECRET_VILLAIN_COPY.policy.chancellorHeading}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {SECRET_VILLAIN_COPY.policy.waitingForChancellor(chancellorName)}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (vetoProposed && vetoResponse === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{SECRET_VILLAIN_COPY.policy.chancellorHeading}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {SECRET_VILLAIN_COPY.policy.vetoProposed}
          </p>
        </CardContent>
      </Card>
    );
  }

  const vetoWasRejected = vetoProposed && vetoResponse === false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{SECRET_VILLAIN_COPY.policy.chancellorHeading}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {SECRET_VILLAIN_COPY.policy.chancellorInstructions}
        </p>
        {vetoWasRejected && (
          <p className="text-sm font-medium text-destructive">
            {SECRET_VILLAIN_COPY.policy.vetoRejected}
          </p>
        )}
        <PolicyCardTable
          cards={remainingCards}
          discardIndex={selectedIndex}
          onSelectDiscard={onSelectCard}
          passAxisLabel={SECRET_VILLAIN_COPY.policy.playAxis}
          disabled={!!isPending}
          svTheme={svTheme}
        />
        <div className="flex gap-2">
          <Button
            onClick={onPlay}
            disabled={selectedIndex === undefined || !!isPending}
          >
            {SECRET_VILLAIN_COPY.policy.play}
          </Button>
          {vetoUnlocked && !vetoWasRejected && onProposeVeto && (
            <Button
              variant="outline"
              onClick={onProposeVeto}
              disabled={!!isPending}
            >
              {SECRET_VILLAIN_COPY.policy.proposeVeto}
            </Button>
          )}
        </div>
        {vetoUnlocked && !vetoWasRejected && (
          <p className="text-sm text-muted-foreground">
            {SECRET_VILLAIN_COPY.policy.vetoAvailable}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
