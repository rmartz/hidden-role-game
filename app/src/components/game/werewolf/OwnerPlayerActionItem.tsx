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
  playerName: string;
  isDead: boolean;
  isDaytime?: boolean;
  trialBlocked?: boolean;
  isSmited?: boolean;
}

export function OwnerPlayerActionItem({
  gameId,
  playerId,
  playerName,
  isDead,
  isDaytime,
  trialBlocked,
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

  const handleKill = () => {
    action.mutate({
      actionId: WerewolfAction.KillPlayer,
      payload: { playerId },
    });
  };

  const handleSmite = () => {
    action.mutate({
      actionId: WerewolfAction.SmitePlayer,
      payload: { playerId },
    });
  };

  const handleUnsmite = () => {
    action.mutate({
      actionId: WerewolfAction.UnsmitePlayer,
      payload: { playerId },
    });
  };

  if (isDead) {
    return (
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="xs"
          onClick={handleRevive}
          disabled={action.isPending}
        >
          Revive
        </Button>
      </div>
    );
  }

  if (isDaytime) {
    return (
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="xs"
          onClick={handlePutToVote}
          disabled={action.isPending || !!trialBlocked}
        >
          {WEREWOLF_COPY.trial.putToVote}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                size="xs"
                disabled={action.isPending}
              />
            }
          >
            {WEREWOLF_COPY.kill.button}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {WEREWOLF_COPY.kill.confirmTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {WEREWOLF_COPY.kill.confirmDescription(playerName)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {WEREWOLF_COPY.kill.confirmCancel}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleKill}>
                {WEREWOLF_COPY.kill.confirmAction}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (isSmited) {
    return (
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="xs"
          onClick={handleUnsmite}
          disabled={action.isPending}
        >
          {WEREWOLF_COPY.smite.undo}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="destructive"
              size="xs"
              disabled={action.isPending}
            />
          }
        >
          {WEREWOLF_COPY.narrator.smite}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {WEREWOLF_COPY.smite.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {WEREWOLF_COPY.smite.confirmDescription(playerName)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {WEREWOLF_COPY.smite.confirmCancel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSmite}>
              {WEREWOLF_COPY.smite.confirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
