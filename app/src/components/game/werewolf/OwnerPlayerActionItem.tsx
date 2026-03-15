"use client";

import { WerewolfAction } from "@/lib/game-modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";

interface Props {
  gameId: string;
  playerId: string;
  isDead: boolean;
}

export function OwnerPlayerActionItem({ gameId, playerId, isDead }: Props) {
  const action = useGameAction(gameId);

  if (isDead) {
    return (
      <Button
        variant="outline"
        size="xs"
        onClick={() => {
          action.mutate({
            actionId: WerewolfAction.MarkPlayerAlive,
            payload: { playerId },
          });
        }}
        disabled={action.isPending}
      >
        Revive
      </Button>
    );
  }

  return (
    <Button
      variant="destructive"
      size="xs"
      onClick={() => {
        if (window.confirm("Mark this player as dead?")) {
          action.mutate({
            actionId: WerewolfAction.MarkPlayerDead,
            payload: { playerId },
          });
        }
      }}
      disabled={action.isPending}
    >
      Kill
    </Button>
  );
}
