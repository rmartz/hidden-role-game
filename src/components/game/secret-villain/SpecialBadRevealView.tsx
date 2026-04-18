"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";

interface SpecialBadRevealViewProps {
  chancellorName: string;
  specialBadRoleName: string;
  badTeamLabel: string;
  badPolicyLabel: string;
  isChancellor: boolean;
  /** Set once the chancellor has acted. */
  revealed?: boolean;
  onConfirm: () => void;
  onReveal: () => void;
  onContinue: () => void;
  isPending?: boolean;
}

export function SpecialBadRevealView({
  chancellorName,
  specialBadRoleName,
  badTeamLabel,
  badPolicyLabel,
  isChancellor,
  revealed,
  onConfirm,
  onReveal,
  onContinue,
  isPending,
}: SpecialBadRevealViewProps) {
  const copy = SECRET_VILLAIN_COPY.specialBadReveal;

  return revealed !== undefined ? (
    <Card>
      <CardHeader>
        <CardTitle>{copy.waitingHeading}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {revealed
            ? copy.outcomeRevealed(
                chancellorName,
                specialBadRoleName,
                badTeamLabel,
              )
            : copy.outcomeConfirmed(chancellorName, specialBadRoleName)}
        </p>
        <Button onClick={onContinue} disabled={!!isPending}>
          {copy.continueButton}
        </Button>
      </CardContent>
    </Card>
  ) : isChancellor ? (
    <Card>
      <CardHeader>
        <CardTitle>{copy.chancellorHeading}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {copy.chancellorInstructions(specialBadRoleName, badPolicyLabel)}
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={onConfirm} disabled={!!isPending}>
            {copy.confirmButton(specialBadRoleName)}
          </Button>
          <Button
            variant="destructive"
            onClick={onReveal}
            disabled={!!isPending}
          >
            {copy.revealButton(specialBadRoleName)}
          </Button>
        </div>
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle>{copy.waitingHeading}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{copy.waitingMessage(chancellorName)}</p>
      </CardContent>
    </Card>
  );
}
