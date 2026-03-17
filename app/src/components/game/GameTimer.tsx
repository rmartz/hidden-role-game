"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

interface GameTimerProps {
  durationSeconds?: number;
  onTimerTrigger?: () => void;
  startedAt: Date;
  /** Timer resets whenever this value changes. */
  resetKey?: string | number;
}

export function GameTimer({
  durationSeconds,
  startedAt,
  onTimerTrigger,
  resetKey,
}: GameTimerProps) {
  const isTimed = durationSeconds !== undefined;
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

  // Reset on resetKey, durationSeconds, or startedAt change.
  const reset = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = startedAtMs;
    hasTriggeredRef.current = false;
    setElapsedSeconds(Math.max(0, Math.floor((now - startedAtMs) / 1000)));
  }, [startedAtMs]);

  useEffect(() => {
    reset();
  }, [resetKey, durationSeconds, reset]);

  // Tick every second.
  useEffect(() => {
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
  }, [durationSeconds, isTimed]);

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
            Time remaining:{" "}
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
    </div>
  );
}
