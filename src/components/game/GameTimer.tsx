"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_TIMER_COPY } from "./GameTimer.copy";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

interface GameTimerProps {
  durationSeconds: number;
  autoAdvance: boolean;
  onTimerTrigger?: () => void;
  startedAt: Date;
  /** Timer resets whenever this value changes. */
  resetKey?: string | number;
}

export function GameTimer({
  durationSeconds,
  autoAdvance,
  startedAt,
  onTimerTrigger,
  resetKey,
}: GameTimerProps) {
  const rawStartedAtMs = startedAt.getTime();
  const startedAtMs = isNaN(rawStartedAtMs) ? Date.now() : rawStartedAtMs;

  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
  );
  const startTimeRef = useRef(startedAtMs);
  const hasTriggeredRef = useRef(false);
  const onTriggerRef = useRef(onTimerTrigger);

  useEffect(() => {
    onTriggerRef.current = onTimerTrigger;
  });

  const reset = useCallback(() => {
    startTimeRef.current = startedAtMs;
    hasTriggeredRef.current = false;
    setElapsedSeconds(
      Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
    );
  }, [startedAtMs]);

  useEffect(() => {
    reset();
  }, [resetKey, durationSeconds, reset]);

  useEffect(() => {
    const tick = () => {
      const elapsed = Math.max(
        0,
        Math.floor((Date.now() - startTimeRef.current) / 1000),
      );
      setElapsedSeconds(elapsed);

      if (elapsed >= durationSeconds && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onTriggerRef.current?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [durationSeconds, autoAdvance]);

  const secondsRemaining = Math.max(0, durationSeconds - elapsedSeconds);
  const hasExpired = secondsRemaining === 0;
  const overtimeSeconds = hasExpired ? elapsedSeconds - durationSeconds : 0;

  return (
    <div className="flex items-center gap-3">
      <p
        className={
          hasExpired && !autoAdvance
            ? "text-red-700 dark:text-red-400"
            : "text-muted-foreground"
        }
      >
        {hasExpired && autoAdvance ? (
          GAME_TIMER_COPY.advancing
        ) : hasExpired ? (
          <>
            {GAME_TIMER_COPY.overtime}{" "}
            <strong>({formatTime(overtimeSeconds)})</strong>
          </>
        ) : (
          <>
            {GAME_TIMER_COPY.timeRemaining}{" "}
            <strong className="text-foreground">
              {formatTime(secondsRemaining)}
            </strong>
          </>
        )}
      </p>
    </div>
  );
}
