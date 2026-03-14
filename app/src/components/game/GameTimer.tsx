"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

interface TimedProps {
  durationSeconds: number;
  onTimerTrigger: () => void;
}

interface ManualProps {
  durationSeconds?: undefined;
  onTimerTrigger?: undefined;
}

type Props = (TimedProps | ManualProps) & {
  startedAt: Date;
  isPaused?: boolean;
  onTogglePause?: (paused: boolean) => void;
  /** Timer resets whenever this value changes. */
  resetKey?: string | number;
};

export function GameTimer({
  durationSeconds,
  startedAt,
  isPaused = false,
  onTimerTrigger,
  onTogglePause,
  resetKey,
}: Props) {
  const isTimed = durationSeconds !== undefined;
  const startedAtMs = startedAt.getTime();

  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
  );
  const startTimeRef = useRef(startedAtMs);
  const pausedElapsedRef = useRef(0);
  const hasTriggeredRef = useRef(false);
  const onTriggerRef = useRef(onTimerTrigger);

  useEffect(() => {
    onTriggerRef.current = onTimerTrigger;
  });

  // Reset on resetKey, durationSeconds, or startedAt change.
  const reset = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = startedAtMs;
    pausedElapsedRef.current = 0;
    hasTriggeredRef.current = false;
    setElapsedSeconds(Math.max(0, Math.floor((now - startedAtMs) / 1000)));
  }, [startedAtMs]);

  useEffect(() => {
    reset();
  }, [resetKey, durationSeconds, reset]);

  // Handle pause transitions.
  const wasPausedRef = useRef(isPaused);
  useEffect(() => {
    if (isPaused && !wasPausedRef.current) {
      pausedElapsedRef.current = Math.floor(
        (Date.now() - startTimeRef.current) / 1000,
      );
    } else if (!isPaused && wasPausedRef.current) {
      startTimeRef.current = Date.now() - pausedElapsedRef.current * 1000;
    }
    wasPausedRef.current = isPaused;
  }, [isPaused]);

  // Tick every second.
  useEffect(() => {
    if (isPaused) return;

    const tick = () => {
      const elapsed = Math.max(
        0,
        Math.floor((Date.now() - startTimeRef.current) / 1000),
      );
      setElapsedSeconds(elapsed);

      if (isTimed && elapsed >= durationSeconds && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onTriggerRef.current?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isPaused, durationSeconds, isTimed]);

  const secondsRemaining = isTimed
    ? Math.max(0, durationSeconds - elapsedSeconds)
    : null;
  const hasExpired = isTimed && secondsRemaining === 0;

  return (
    <div className="flex items-center gap-3">
      <p className="text-muted-foreground">
        {hasExpired ? (
          "Advancing\u2026"
        ) : isTimed ? (
          <>
            {isPaused ? "Paused" : "Time remaining"}:{" "}
            <strong className="text-foreground">
              {formatTime(secondsRemaining ?? 0)}
            </strong>
          </>
        ) : (
          <>
            Elapsed:{" "}
            <strong className="text-foreground">
              {formatTime(elapsedSeconds)}
            </strong>
          </>
        )}
      </p>
      {isTimed && !hasExpired && onTogglePause && (
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            onTogglePause(!isPaused);
          }}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
      )}
    </div>
  );
}
