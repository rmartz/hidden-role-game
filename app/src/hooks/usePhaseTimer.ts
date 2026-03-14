"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePhaseTimerOptions {
  /** Target duration in seconds. null = manual mode (count up only). */
  durationSeconds: number | null;
  /** When true, the timer freezes. */
  isPaused: boolean;
  /** Called once when the countdown reaches zero. */
  onExpire?: () => void;
  /** Timer restarts whenever this value changes. */
  resetKey: string | number;
}

interface UsePhaseTimerResult {
  /** Seconds remaining in countdown mode. null when manual mode. */
  secondsRemaining: number | null;
  /** Seconds elapsed since the timer started (always available). */
  elapsedSeconds: number;
}

/**
 * Phase timer hook supporting both countdown (auto-advance) and elapsed (manual) modes.
 *
 * - When `durationSeconds` is a number, counts down and calls `onExpire` at zero.
 * - When `durationSeconds` is null, counts up (elapsed time only).
 * - Uses absolute timestamps to avoid drift.
 * - Respects `isPaused` to freeze the timer.
 * - Resets when `resetKey` changes.
 */
export function usePhaseTimer({
  durationSeconds,
  isPaused,
  onExpire,
  resetKey,
}: UsePhaseTimerOptions): UsePhaseTimerResult {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(Date.now());
  const pausedElapsedRef = useRef(0);
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  // Reset on resetKey or durationSeconds change.
  const reset = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedElapsedRef.current = 0;
    hasExpiredRef.current = false;
    setElapsedSeconds(0);
  }, []);

  useEffect(() => {
    reset();
  }, [resetKey, durationSeconds, reset]);

  // Handle pause: when pausing, store the elapsed time; when resuming, adjust the start time.
  const wasPausedRef = useRef(isPaused);
  useEffect(() => {
    if (isPaused && !wasPausedRef.current) {
      // Entering pause: capture elapsed.
      pausedElapsedRef.current = Math.floor(
        (Date.now() - startTimeRef.current) / 1000,
      );
    } else if (!isPaused && wasPausedRef.current) {
      // Resuming: adjust start time so elapsed stays continuous.
      startTimeRef.current = Date.now() - pausedElapsedRef.current * 1000;
    }
    wasPausedRef.current = isPaused;
  }, [isPaused]);

  // Tick every second.
  useEffect(() => {
    if (isPaused) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);

      // Check for expiry in countdown mode.
      if (
        durationSeconds !== null &&
        elapsed >= durationSeconds &&
        !hasExpiredRef.current
      ) {
        hasExpiredRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isPaused, durationSeconds]);

  const secondsRemaining =
    durationSeconds !== null
      ? Math.max(0, durationSeconds - elapsedSeconds)
      : null;

  return { secondsRemaining, elapsedSeconds };
}
