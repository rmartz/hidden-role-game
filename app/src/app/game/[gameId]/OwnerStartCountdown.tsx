"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  durationSeconds: number;
  onStart: () => void;
}

export default function OwnerStartCountdown({
  durationSeconds,
  onStart,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const hasStartedRef = useRef(false);
  const onStartRef = useRef(onStart);
  useEffect(() => {
    onStartRef.current = onStart;
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        onStartRef.current();
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
    <p>
      Players are reading their roles.{" "}
      {secondsLeft > 0 ? (
        <>
          Starting in <strong>{secondsLeft}</strong> second
          {secondsLeft !== 1 ? "s" : ""}…
        </>
      ) : (
        "Advancing…"
      )}
    </p>
  );
}
