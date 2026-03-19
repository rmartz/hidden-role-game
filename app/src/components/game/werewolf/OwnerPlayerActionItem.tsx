"use client";

import { WEREWOLF_COPY, WerewolfAction } from "@/lib/game-modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const handleRevive = () => {
    action.mutate({
      actionId: WerewolfAction.MarkPlayerAlive,
      payload: { playerId },
    });
  };

  const handleKill = () => {
    action.mutate({
      actionId: WerewolfAction.MarkPlayerDead,
      payload: { playerId },
    });
  };

  const handlePutToVote = () => {
    action.mutate({
      actionId: WerewolfAction.StartTrial,
      payload: { defendantId: playerId },
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
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="xs" disabled={action.isPending} />
        }
      >
        Kill
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{WEREWOLF_COPY.killConfirm.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {WEREWOLF_COPY.killConfirm.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {WEREWOLF_COPY.killConfirm.cancel}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleKill}>
            {WEREWOLF_COPY.killConfirm.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return <div className="flex gap-1">{button}</div>;
}
