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
  resultLabel?: string;
  secondTargetName?: string;
}

export function OwnerInvestigationConfirm({
  gameId,
  targetName,
  isWerewolfTeam,
  isResultRevealed,
  resultLabel,
  secondTargetName,
}: OwnerInvestigationConfirmProps) {
  const action = useGameAction(gameId);
  const displayLabel =
    resultLabel ?? WEREWOLF_COPY.narrator.teamStatus(isWerewolfTeam);

  return (
    <div className="mt-3 rounded-md border p-3 text-sm">
      <p className="font-medium mb-2">
        {WEREWOLF_COPY.narrator.investigationResultLabel}{" "}
        <strong className="text-foreground">{targetName}</strong>
        {secondTargetName ? (
          <>
            {" "}
            and <strong className="text-foreground">
              {secondTargetName}
            </strong>{" "}
            are <strong className="text-foreground">{displayLabel}</strong>.
          </>
        ) : (
          <>
            {" "}
            is <strong className="text-foreground">{displayLabel}</strong>.
          </>
        )}
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
