"use client";

import {
  WEREWOLF_COPY,
  NOMINATION_VOTE_THRESHOLD,
} from "@/lib/game-modes/werewolf";
import { Button } from "@/components/ui/button";

interface NominationRowProps {
  player: { id: string; name: string };
  count: number;
  isMyTarget: boolean;
  canAct: boolean;
  isPending: boolean;
  onNominate: (defendantId: string) => void;
}

export function NominationRow({
  player,
  count,
  isMyTarget,
  canAct,
  isPending,
  onNominate,
}: NominationRowProps) {
  const { nomination } = WEREWOLF_COPY;
  const buttonLabel =
    count > 0
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
      {count > 0 && (
        <span className="text-xs text-muted-foreground">
          {nomination.nominationCount(count, NOMINATION_VOTE_THRESHOLD)}
        </span>
      )}
      {actionElement}
    </li>
  );
}
