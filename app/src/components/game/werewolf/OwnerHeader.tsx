"use client";

import type { ReactNode } from "react";
import { GameTimer } from "@/components/game/GameTimer";
import { Button } from "@/components/ui/button";

interface TimedTimer {
  durationSeconds: number;
  onTimerTrigger: () => void;
}

interface ManualTimer {
  durationSeconds?: undefined;
}

type TimerProps = (TimedTimer | ManualTimer) & {
  startedAt: Date;
  resetKey?: string | number;
};

interface OwnerHeaderProps {
  title: string;
  advanceLabel: string;
  onAdvance: () => void;
  isAdvancing?: boolean;
  timer: TimerProps;
  children?: ReactNode;
}

export function OwnerHeader({
  title,
  advanceLabel,
  onAdvance,
  isAdvancing,
  timer,
  children,
}: OwnerHeaderProps) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      {timer.durationSeconds !== undefined ? (
        <GameTimer
          durationSeconds={timer.durationSeconds}
          startedAt={timer.startedAt}
          onTimerTrigger={timer.onTimerTrigger}
          resetKey={timer.resetKey}
        />
      ) : (
        <GameTimer startedAt={timer.startedAt} resetKey={timer.resetKey} />
      )}
      {children}
      <Button onClick={onAdvance} disabled={isAdvancing} className="mb-5">
        {advanceLabel}
      </Button>
    </>
  );
}
