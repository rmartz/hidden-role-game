"use client";

import { WEREWOLF_COPY, WerewolfAction } from "@/lib/game-modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";

interface OwnerPlayerActionItemProps {
  gameId: string;
  playerId: string;
  isDead: boolean;
  isDaytime?: boolean;
  hasActiveTrial?: boolean;
}

export function OwnerPlayerActionItem({
  gameId,
  playerId,
  isDead,
  isDaytime,
  hasActiveTrial,
}: OwnerPlayerActionItemProps) {
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

  const handleKill = () => {
    if (window.confirm("Mark this player as dead?")) {
      action.mutate({
        actionId: WerewolfAction.MarkPlayerDead,
        payload: { playerId },
      });
    }
  };

  const handlePutToVote = () => {
    action.mutate({
      actionId: WerewolfAction.StartTrial,
      payload: { defendantId: playerId },
    });
  };

  if (isDaytime) {
    return (
      <div className="flex gap-1">
        {!hasActiveTrial && (
          <Button
            variant="outline"
            size="xs"
            onClick={handlePutToVote}
            disabled={action.isPending}
          >
            {WEREWOLF_COPY.trial.putToVote}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="destructive"
        size="xs"
        onClick={handleKill}
        disabled={action.isPending}
      >
        Kill
      </Button>
    </div>
  );
}
