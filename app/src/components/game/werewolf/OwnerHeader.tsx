"use client";

import type { ReactNode } from "react";
import { ChartPersonRegular } from "@fluentui/react-icons";
import { GameTimer } from "@/components/game/GameTimer";
import { Button } from "@/components/ui/button";

interface TimerProps {
  durationSeconds: number;
  autoAdvance: boolean;
  onTimerTrigger?: () => void;
  startedAt: Date;
  resetKey?: string | number;
}

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
      <GameTimer {...timer} />
      {children}
      <div className="flex justify-center mb-5">
        <Button onClick={onAdvance} disabled={isAdvancing}>
          <ChartPersonRegular />
          {advanceLabel}
        </Button>
      </div>
    </>
  );
}
