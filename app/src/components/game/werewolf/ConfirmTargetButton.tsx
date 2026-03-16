"use client";

import { WerewolfAction, getConfirmLabel } from "@/lib/game-modes/werewolf";
import type { PhaseKey, WitchConfirmContext } from "@/lib/game-modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";

interface Props {
  gameId: string;
  roleId?: PhaseKey;
  hasTarget: boolean;
  isConfirmed: boolean;
  isGroupPhase?: boolean;
  allAgreed?: boolean;
  witchContext?: WitchConfirmContext;
}

export function ConfirmTargetButton({
  gameId,
  roleId,
  hasTarget,
  isConfirmed,
  isGroupPhase,
  allAgreed,
  witchContext,
}: Props) {
  const action = useGameAction(gameId);

  if (isConfirmed) {
    return (
      <p className="mt-3 text-sm text-green-600 font-medium">
        Target confirmed. Wait for the Narrator to continue.
      </p>
    );
  }

  if (!hasTarget) return null;

  // Group phases require all members to agree before confirming.
  const disabled = action.isPending || (isGroupPhase && !allAgreed);

  return (
    <div className="mt-3">
      <Button
        onClick={() => {
          action.mutate({
            actionId: WerewolfAction.ConfirmNightTarget,
          });
        }}
        disabled={disabled}
      >
        {getConfirmLabel(roleId, witchContext)}
      </Button>
      {isGroupPhase && !allAgreed && (
        <p className="mt-1 text-xs text-muted-foreground">
          All group members must agree on the same target.
        </p>
      )}
    </div>
  );
}
