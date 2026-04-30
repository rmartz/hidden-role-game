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
  /** When set, freezes the timer display at the moment the timer was paused. */
  pausedAt?: Date;
  /** Accumulated elapsed milliseconds from prior running segments, carried into this one on resume. */
  pauseOffset?: number;
}

export function GameTimer({
  durationSeconds,
  autoAdvance,
  startedAt,
  onTimerTrigger,
  resetKey,
  pausedAt,
  pauseOffset = 0,
}: GameTimerProps) {
  const rawStartedAtMs = startedAt.getTime();
  const startedAtMs = isNaN(rawStartedAtMs) ? Date.now() : rawStartedAtMs;

  const rawPausedAtMs = pausedAt?.getTime();
  const isPaused = pausedAt !== undefined;

  const computeElapsed = useCallback(
    (nowMs: number) => {
      const pausedAtMs =
        rawPausedAtMs !== undefined && !isNaN(rawPausedAtMs)
          ? rawPausedAtMs
          : nowMs;
      const effectiveNow = isPaused ? pausedAtMs : nowMs;
      return Math.max(
        0,
        Math.floor((pauseOffset + (effectiveNow - startedAtMs)) / 1000),
      );
    },
    [isPaused, rawPausedAtMs, pauseOffset, startedAtMs],
  );

  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    computeElapsed(Date.now()),
  );
  const hasTriggeredRef = useRef(false);
  const onTriggerRef = useRef(onTimerTrigger);

  useEffect(() => {
    onTriggerRef.current = onTimerTrigger;
  });

  const reset = useCallback(() => {
    hasTriggeredRef.current = false;
    setElapsedSeconds(computeElapsed(Date.now()));
  }, [computeElapsed]);

  useEffect(() => {
    reset();
  }, [resetKey, durationSeconds, reset]);

  useEffect(() => {
    if (isPaused) {
      setElapsedSeconds(computeElapsed(Date.now()));
      return;
    }

    const tick = () => {
      const elapsed = computeElapsed(Date.now());
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
  }, [durationSeconds, autoAdvance, isPaused, computeElapsed]);

  const secondsRemaining = Math.max(0, durationSeconds - elapsedSeconds);
  const hasExpired = secondsRemaining === 0;
  const overtimeSeconds = hasExpired ? elapsedSeconds - durationSeconds : 0;

  return (
    <div className="flex items-center gap-3">
      <p
        className={
          hasExpired && !autoAdvance
            ? "text-red-800/60 dark:text-red-400/60"
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
            {isPaused ? GAME_TIMER_COPY.paused : GAME_TIMER_COPY.timeRemaining}{" "}
            <strong className="text-foreground">
              {formatTime(secondsRemaining)}
            </strong>
          </>
        )}
      </p>
    </div>
  );
}
