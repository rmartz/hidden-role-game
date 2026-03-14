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
  /** Server-set Unix epoch ms for the phase start. Falls back to Date.now() if omitted. */
  startedAtMs?: number;
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
 * - When `startedAtMs` is provided, computes elapsed from that server timestamp
 *   so timers survive page refreshes and component remounts.
 * - Uses absolute timestamps to avoid drift.
 * - Respects `isPaused` to freeze the timer.
 * - Resets when `resetKey` changes.
 */
export function usePhaseTimer({
  durationSeconds,
  isPaused,
  onExpire,
  resetKey,
  startedAtMs,
}: UsePhaseTimerOptions): UsePhaseTimerResult {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (startedAtMs)
      return Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
    return 0;
  });
  const startTimeRef = useRef(startedAtMs ?? Date.now());
  const pausedElapsedRef = useRef(0);
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  // Reset on resetKey, durationSeconds, or startedAtMs change.
  const reset = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = startedAtMs ?? now;
    pausedElapsedRef.current = 0;
    hasExpiredRef.current = false;
    const initialElapsed = startedAtMs
      ? Math.max(0, Math.floor((now - startedAtMs) / 1000))
      : 0;
    setElapsedSeconds(initialElapsed);
  }, [startedAtMs]);

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
      const elapsed = Math.max(
        0,
        Math.floor((Date.now() - startTimeRef.current) / 1000),
      );
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
