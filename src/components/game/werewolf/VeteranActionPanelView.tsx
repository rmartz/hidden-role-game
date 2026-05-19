"use client";

import { Button } from "@/components/ui/button";
import { VETERAN_ALERTS_LIMIT } from "@/lib/game/modes/werewolf/constants";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

export interface VeteranActionPanelViewProps {
  alertsUsed: number;
  isAlerted: boolean;
  hasDecided: boolean;
  isConfirmed: boolean;
  isPending: boolean;
  onAlert: () => void;
  onSkip: () => void;
  onConfirm: () => void;
}

export function VeteranActionPanelView({
  alertsUsed,
  isAlerted,
  hasDecided,
  isConfirmed,
  isPending,
  onAlert,
  onSkip,
  onConfirm,
}: VeteranActionPanelViewProps) {
  const alertsRemaining = Math.max(0, VETERAN_ALERTS_LIMIT - alertsUsed);
  const alertsExhausted = alertsRemaining <= 0;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        {WEREWOLF_COPY.veteran.alertsRemaining(alertsRemaining)}
      </p>
      {!isConfirmed && (
        <div className="flex flex-col gap-2 max-w-sm mx-auto mb-2">
          <Button
            variant={isAlerted ? "default" : "outline"}
            onClick={onAlert}
            disabled={isPending || alertsExhausted}
          >
            {WEREWOLF_COPY.veteran.alertButton}
          </Button>
          <Button
            variant={!isAlerted && hasDecided ? "default" : "outline"}
            onClick={onSkip}
            disabled={isPending}
          >
            {WEREWOLF_COPY.veteran.skipButton}
          </Button>
        </div>
      )}
      {isConfirmed ? (
        <p className="mt-3 text-sm text-green-800 font-medium dark:text-green-400">
          {WEREWOLF_COPY.confirmButton.actionConfirmed}
        </p>
      ) : (
        <div className="mt-3 max-w-sm mx-auto flex justify-end">
          <Button onClick={onConfirm} disabled={!hasDecided || isPending}>
            {WEREWOLF_COPY.confirmButton.confirm}
          </Button>
        </div>
      )}
    </div>
  );
}
