"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  /** Countdown duration in seconds. null = no auto-start (manual only). */
  durationSeconds: number | null;
  onComplete?: () => void;
  /** When true, shows a "Start Now" button to skip the countdown. */
  allowSkip?: boolean;
  /** Server-set Unix epoch ms for when Starting status began. */
  startedAtMs?: number;
}

export function GameStartCountdown({
  durationSeconds,
  onComplete,
  allowSkip,
  startedAtMs,
}: Props) {
  const initialElapsed = startedAtMs
    ? Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
    : 0;
  const [secondsLeft, setSecondsLeft] = useState(
    durationSeconds !== null
      ? Math.max(0, durationSeconds - initialElapsed)
      : 0,
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsed);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const startTimeRef = useRef(startedAtMs ?? Date.now());

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const triggerComplete = () => {
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onCompleteRef.current?.();
    }
  };

  // Countdown mode.
  useEffect(() => {
    if (durationSeconds === null) return;
    if (secondsLeft <= 0) {
      triggerComplete();
      return;
    }
    const timer = setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [secondsLeft, durationSeconds]);

  // Elapsed mode (manual only).
  useEffect(() => {
    if (durationSeconds !== null) return;
    const interval = setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)),
      );
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [durationSeconds]);

  const isManual = durationSeconds === null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <Card className="mb-5">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {isManual ? (
              <>
                Waiting to start…{" "}
                <strong className="text-foreground">
                  {formatTime(elapsedSeconds)}
                </strong>
              </>
            ) : secondsLeft > 0 ? (
              <>
                Starting in{" "}
                <strong className="text-foreground">{secondsLeft}</strong>{" "}
                second
                {secondsLeft !== 1 ? "s" : ""}…
              </>
            ) : (
              "Starting…"
            )}
          </p>
          {allowSkip && (isManual || secondsLeft > 0) && (
            <Button size="sm" variant="outline" onClick={triggerComplete}>
              Start Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
