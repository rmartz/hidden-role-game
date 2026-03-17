"use client";

import { useState, useEffect } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GameMode } from "@/lib/types";
import type { PublicRoleInfo } from "@/server/types";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

const REVEAL_DURATION_MS = 5000;

interface PlayerRoleDisplayProps {
  role: PublicRoleInfo;
  gameMode?: GameMode;
}

export function PlayerRoleDisplay({ role, gameMode }: PlayerRoleDisplayProps) {
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

  const modeConfig = gameMode ? GAME_MODES[gameMode] : undefined;
  const teamLabel = modeConfig?.teamLabels[role.team] ?? role.team;
  const fullRole = modeConfig?.roles[role.id];
  const roleInfo = fullRole?.summary ?? fullRole?.description;

  return (
    <div className="flex items-center gap-1">
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
      {revealed && roleInfo && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              className="text-xs text-muted-foreground cursor-help px-1"
              aria-label={WEREWOLF_COPY.roleDisplay.roleInfoLabel}
            >
              ?
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-56 text-wrap">
              {roleInfo}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
