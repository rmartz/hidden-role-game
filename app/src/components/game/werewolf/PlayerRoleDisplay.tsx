"use client";

import { useState, useEffect } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import { Button } from "@/components/ui/button";
import type { GameMode } from "@/lib/types";
import type { PublicRoleInfo } from "@/server/types";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

const REVEAL_DURATION_MS = 5000;

interface Props {
  role: PublicRoleInfo;
  gameMode?: GameMode;
}

export function PlayerRoleDisplay({ role, gameMode }: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => {
      setRevealed(false);
    }, REVEAL_DURATION_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [revealed]);

  const teamLabels = gameMode ? GAME_MODES[gameMode].teamLabels : undefined;
  const teamLabel = teamLabels?.[role.team] ?? role.team;

  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold mb-2">
        {WEREWOLF_COPY.roleDisplay.yourRole}
      </h2>
      <Button
        variant={revealed ? "secondary" : "outline"}
        onClick={() => {
          setRevealed((v) => !v);
        }}
      >
        {revealed
          ? WEREWOLF_COPY.roleDisplay.roleRevealed(role.name, teamLabel)
          : WEREWOLF_COPY.roleDisplay.showRole}
      </Button>
    </div>
  );
}
