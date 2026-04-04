"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";
import { cn } from "@/lib/utils";

export interface PolicyPeekViewProps {
  peekedCards: string[];
  onConfirm: () => void;
  isPending?: boolean;
}

export function PolicyPeekView({
  peekedCards,
  onConfirm,
  isPending,
}: PolicyPeekViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {SECRET_VILLAIN_COPY.specialAction.policyPeekHeading}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {SECRET_VILLAIN_COPY.specialAction.policyPeekCardsRevealed}
        </p>
        <div className="flex gap-2">
          {peekedCards.map((card, index) => (
            <div
              key={index}
              className={cn(
                "rounded border-2 px-4 py-2 text-sm font-medium",
                card === "good"
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-red-500 bg-red-500 text-white",
              )}
            >
              {card === "good"
                ? SECRET_VILLAIN_COPY.policy.goodCard
                : SECRET_VILLAIN_COPY.policy.badCard}
            </div>
          ))}
        </div>
        <Button onClick={onConfirm} disabled={!!isPending}>
          {SECRET_VILLAIN_COPY.specialAction.policyPeekConfirm}
        </Button>
      </CardContent>
    </Card>
  );
}
