"use client";

import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";
import { Button } from "@/components/ui/button";

interface NominationRowProps {
  player: { id: string; name: string };
  nominatorName?: string;
  isMyTarget: boolean;
  canAct: boolean;
  isNominated: boolean;
  isPending: boolean;
  onNominate: (defendantId: string) => void;
}

export function NominationRow({
  player,
  nominatorName,
  isMyTarget,
  canAct,
  isNominated,
  isPending,
  onNominate,
}: NominationRowProps) {
  const { nomination } = WEREWOLF_COPY;
  const buttonLabel = isNominated
    ? nomination.secondButton(player.name)
    : nomination.nominateButton(player.name);

  const actionElement = isMyTarget ? (
    <span className="text-xs text-muted-foreground italic">
      {nomination.yourNomination}
    </span>
  ) : canAct ? (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        onNominate(player.id);
      }}
      disabled={isPending}
    >
      {buttonLabel}
    </Button>
  ) : null;

  return (
    <li className="flex items-center gap-3">
      <span className="flex-1 text-sm">{player.name}</span>
      {nominatorName && (
        <span className="text-xs text-muted-foreground">
          {nomination.nominatedBy(nominatorName)}
        </span>
      )}
      {actionElement}
    </li>
  );
}
