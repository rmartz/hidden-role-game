"use client";

import { Button } from "@/components/ui/button";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

interface Props {
  /** Seconds remaining in countdown. null = manual mode (show elapsed). */
  secondsRemaining: number | null;
  /** Total elapsed seconds. */
  elapsedSeconds: number;
  /** Whether the timer is currently paused. */
  isPaused: boolean;
  /** Called when the pause/resume button is clicked. */
  onTogglePause: () => void;
}

export function PhaseTimer({
  secondsRemaining,
  elapsedSeconds,
  isPaused,
  onTogglePause,
}: Props) {
  const isCountdown = secondsRemaining !== null;

  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-muted-foreground">
        {isCountdown ? (
          <>
            {isPaused ? "Paused" : "Auto-advance"} in{" "}
            <strong className="text-foreground">
              {formatTime(secondsRemaining)}
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
      {isCountdown && (
        <Button size="xs" variant="outline" onClick={onTogglePause}>
          {isPaused ? "Resume" : "Pause"}
        </Button>
      )}
    </div>
  );
}
