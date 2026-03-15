"use client";

import { WerewolfAction } from "@/lib/game-modes/werewolf";
import { Button } from "@/components/ui/button";
import { useGameAction } from "@/hooks";

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
        Investigation result:{" "}
        <strong className="text-foreground">{targetName}</strong> is{" "}
        <strong className="text-foreground">
          {isWerewolfTeam ? "" : "not "}on the Werewolf team
        </strong>
        .
      </p>
      {isResultRevealed ? (
        <p className="text-xs text-muted-foreground">
          Result revealed to Seer.
        </p>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            action.mutate({
              actionId: WerewolfAction.RevealInvestigationResult,
            });
          }}
          disabled={action.isPending}
        >
          Reveal to Seer
        </Button>
      )}
    </div>
  );
}
