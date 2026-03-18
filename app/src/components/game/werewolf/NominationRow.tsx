"use client";

import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";
import { Button } from "@/components/ui/button";

interface NominationRowProps {
  player: { id: string; name: string };
  nominatorIds: string[];
  players: { id: string; name: string }[];
  isMyTarget: boolean;
  canAct: boolean;
  isPending: boolean;
  onNominate: (defendantId: string) => void;
}

export function NominationRow({
  player,
  nominatorIds,
  players,
  isMyTarget,
  canAct,
  isPending,
  onNominate,
}: NominationRowProps) {
  const { nomination } = WEREWOLF_COPY;
  const isNominated = nominatorIds.length > 0;
  const buttonLabel = isNominated
    ? nomination.secondButton(player.name)
    : nomination.nominateButton(player.name);

  const playerById = new Map(players.map((p) => [p.id, p]));
  const nominatorName =
    playerById.get(nominatorIds[0] ?? "")?.name ?? "Unknown";

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
      {isNominated && (
        <span className="text-xs text-muted-foreground">
          {nomination.nominatedBy(nominatorName)}
        </span>
      )}
      {actionElement}
    </li>
  );
}
