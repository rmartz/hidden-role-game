"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  durationSeconds: number;
  onComplete?: () => void;
}

export function GameStartCountdown({ durationSeconds, onComplete }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }
    const timer = setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [secondsLeft]);

  return (
    <Card className="mb-5">
      <CardContent className="pt-6">
        <p className="text-muted-foreground">
          {secondsLeft > 0 ? (
            <>
              Starting in{" "}
              <strong className="text-foreground">{secondsLeft}</strong> second
              {secondsLeft !== 1 ? "s" : ""}…
            </>
          ) : (
            "Starting…"
          )}
        </p>
      </CardContent>
    </Card>
  );
}
