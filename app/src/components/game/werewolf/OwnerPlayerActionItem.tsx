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
  isSmited?: boolean;
}

export function OwnerPlayerActionItem({
  gameId,
  playerId,
  isDead,
  isDaytime,
  hasActiveTrial,
  isSmited,
}: OwnerPlayerActionItemProps) {
  const action = useGameAction(gameId);

  const handleRevive = () => {
    action.mutate({
      actionId: WerewolfAction.MarkPlayerAlive,
      payload: { playerId },
    });
  };

  const handlePutToVote = () => {
    action.mutate({
      actionId: WerewolfAction.StartTrial,
      payload: { defendantId: playerId },
    });
  };

  const handleSmite = () => {
    action.mutate({
      actionId: WerewolfAction.SmitePlayer,
      payload: { playerId },
    });
  };

  const button = isDead ? (
    <Button
      variant="outline"
      size="xs"
      onClick={handleRevive}
      disabled={action.isPending}
    >
      Revive
    </Button>
  ) : isDaytime ? (
    <Button
      variant="outline"
      size="xs"
      onClick={handlePutToVote}
      disabled={action.isPending || !!hasActiveTrial}
    >
      {WEREWOLF_COPY.trial.putToVote}
    </Button>
  ) : (
    <Button
      variant="destructive"
      size="xs"
      onClick={handleSmite}
      disabled={action.isPending || isSmited}
    >
      {WEREWOLF_COPY.narrator.smite}
    </Button>
  );

  return <div className="flex gap-1">{button}</div>;
}
