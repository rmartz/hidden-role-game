"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import type { SvTheme } from "@/lib/game/modes/secret-villain/themes";
import { PolicyCardTable } from "./PolicyCardTable";

interface PolicyPresidentViewProps {
  drawnCards: string[];
  cardsRevealed?: boolean;
  selectedIndex?: number;
  onSelectCard: (index: number) => void;
  onDraw: () => void;
  onDiscard: () => void;
  isPending?: boolean;
  isPresident: boolean;
  presidentName: string;
  svTheme?: SvTheme;
}

export function PolicyPresidentView({
  drawnCards,
  cardsRevealed,
  selectedIndex,
  onSelectCard,
  onDraw,
  onDiscard,
  isPending,
  isPresident,
  presidentName,
  svTheme,
}: PolicyPresidentViewProps) {
  if (!isPresident) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{SECRET_VILLAIN_COPY.policy.presidentHeading}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {SECRET_VILLAIN_COPY.policy.waitingForPresident(presidentName)}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Before drawing: show "Draw" button.
  if (!cardsRevealed || drawnCards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{SECRET_VILLAIN_COPY.policy.presidentHeading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            {SECRET_VILLAIN_COPY.policy.presidentDrawInstructions}
          </p>
          <Button onClick={onDraw} disabled={!!isPending}>
            {SECRET_VILLAIN_COPY.policy.presidentDraw}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // After drawing: show cards and discard selection.
  return (
    <Card>
      <CardHeader>
        <CardTitle>{SECRET_VILLAIN_COPY.policy.presidentHeading}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {SECRET_VILLAIN_COPY.policy.presidentInstructions}
        </p>
        <PolicyCardTable
          cards={drawnCards}
          discardIndex={selectedIndex}
          onSelectDiscard={onSelectCard}
          disabled={!!isPending}
          svTheme={svTheme}
        />
        <Button
          onClick={onDiscard}
          disabled={selectedIndex === undefined || !!isPending}
        >
          {SECRET_VILLAIN_COPY.policy.discard}
        </Button>
      </CardContent>
    </Card>
  );
}
