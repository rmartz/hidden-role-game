"use client";

import { WerewolfAction } from "@/lib/game/modes/werewolf";
import { useGameAction } from "@/hooks";
import { VeteranActionPanelView } from "./VeteranActionPanelView";

interface VeteranActionPanelProps {
  gameId: string;
  alertsUsed: number;
  isAlerted: boolean;
  hasDecided: boolean;
  isConfirmed: boolean;
}

export function VeteranActionPanel({
  gameId,
  alertsUsed,
  isAlerted,
  hasDecided,
  isConfirmed,
}: VeteranActionPanelProps) {
  const action = useGameAction(gameId);

  return (
    <VeteranActionPanelView
      alertsUsed={alertsUsed}
      isAlerted={isAlerted}
      hasDecided={hasDecided}
      isConfirmed={isConfirmed}
      isPending={action.isPending}
      onAlert={() => {
        action.mutate({
          actionId: WerewolfAction.SetNightTarget,
          payload: { alerted: true },
        });
      }}
      onSkip={() => {
        action.mutate({
          actionId: WerewolfAction.SetNightTarget,
          payload: { targetPlayerId: null },
        });
      }}
      onConfirm={() => {
        action.mutate({ actionId: WerewolfAction.ConfirmNightTarget });
      }}
    />
  );
}
