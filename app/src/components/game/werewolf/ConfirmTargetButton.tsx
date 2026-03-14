"use client";

import { WerewolfAction, getConfirmLabel } from "@/lib/game-modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";

interface Props {
  gameId: string;
  roleId: string | undefined;
  hasTarget: boolean;
  isConfirmed: boolean;
}

export function ConfirmTargetButton({
  gameId,
  roleId,
  hasTarget,
  isConfirmed,
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

  return (
    <Button
      className="mt-3"
      onClick={() => {
        action.mutate({
          actionId: WerewolfAction.ConfirmNightTarget,
        });
      }}
      disabled={action.isPending}
    >
      {getConfirmLabel(roleId)}
    </Button>
  );
}
