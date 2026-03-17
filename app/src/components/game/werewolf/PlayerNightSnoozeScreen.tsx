"use client";

import { useState } from "react";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface PlayerNightSnoozeScreenProps {
  amDead: boolean;
}

export function PlayerNightSnoozeScreen({
  amDead,
}: PlayerNightSnoozeScreenProps) {
  const strings = amDead
    ? WEREWOLF_COPY.night.eliminatedNight
    : WEREWOLF_COPY.night.stopPeeking;

  const [message] = useState(
    () => strings[Math.floor(Math.random() * strings.length)],
  );

  return (
    <div className="p-5">
      <p className="text-muted-foreground italic">{message}</p>
    </div>
  );
}
