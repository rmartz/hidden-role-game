"use client";

import { WerewolfAction } from "@/lib/game-modes/werewolf";
import { Button } from "@/components/ui/button";
import { useGameAction } from "@/hooks";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface OwnerInvestigationConfirmProps {
  gameId: string;
  targetName: string;
  isWerewolfTeam: boolean;
  isResultRevealed: boolean;
}

export function OwnerInvestigationConfirm({
  gameId,
  targetName,
  isWerewolfTeam,
  isResultRevealed,
}: OwnerInvestigationConfirmProps) {
  const action = useGameAction(gameId);

  return (
    <div className="mt-3 rounded-md border p-3 text-sm">
      <p className="font-medium mb-2">
        {WEREWOLF_COPY.narrator.investigationResultLabel}{" "}
        <strong className="text-foreground">{targetName}</strong> is{" "}
        <strong className="text-foreground">
          {WEREWOLF_COPY.narrator.teamStatus(isWerewolfTeam)}
        </strong>
        .
      </p>
      {isResultRevealed ? (
        <p className="text-xs text-muted-foreground">
          {WEREWOLF_COPY.narrator.investigationResultRevealed}
        </p>
      ) : (
        <Button
          size="sm"
          variant="default"
          onClick={() => {
            action.mutate({
              actionId: WerewolfAction.RevealInvestigationResult,
            });
          }}
          disabled={action.isPending}
        >
          {WEREWOLF_COPY.narrator.revealToPlayer}
        </Button>
      )}
    </div>
  );
}
