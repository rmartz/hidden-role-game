"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";
import { getSvThemeLabels } from "@/lib/game-modes/secret-villain/themes";
import type { SvTheme } from "@/lib/game-modes/secret-villain/themes";
import { cn } from "@/lib/utils";

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
  const themeLabels = getSvThemeLabels(svTheme);
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
        <div className="flex gap-2">
          {drawnCards.map((card, index) => (
            <Button
              key={index}
              variant={selectedIndex === index ? "default" : "outline"}
              className={cn(
                card === "good"
                  ? "border-green-500 text-green-700"
                  : "border-red-500 text-red-700",
                selectedIndex === index &&
                  (card === "good"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"),
              )}
              onClick={() => {
                onSelectCard(index);
              }}
            >
              {card === "good" ? themeLabels.goodPolicy : themeLabels.badPolicy}
            </Button>
          ))}
        </div>
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
