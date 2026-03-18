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
import { InfoIcon } from "lucide-react";
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
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => {
      setRevealed(false);
    }, REVEAL_DURATION_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [revealed]);

  useEffect(() => {
    if (!revealed) {
      setTooltipOpen(false);
    }
  }, [revealed]);

  const modeConfig = gameMode ? GAME_MODES[gameMode] : undefined;
  const teamLabel = modeConfig?.teamLabels[role.team] ?? role.team;
  const fullRole = modeConfig?.roles[role.id];
  const hasInfo = !!(fullRole?.summary ?? fullRole?.description);

  const revealedButton = (
    <Button
      variant="secondary"
      onClick={(e) => {
        e.stopPropagation();
        setRevealed(false);
      }}
    >
      {WEREWOLF_COPY.roleDisplay.roleRevealed(role.name, teamLabel)}
    </Button>
  );

  const hiddenButton = (
    <Button
      variant="outline"
      onClick={() => {
        setRevealed(true);
      }}
    >
      {WEREWOLF_COPY.roleDisplay.showRole}
    </Button>
  );

  if (!revealed || !hasInfo) {
    return revealed ? revealedButton : hiddenButton;
  }

  return (
    <TooltipProvider>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger
          render={
            <div
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-default"
              onClick={() => {
                setTooltipOpen((v) => !v);
              }}
            />
          }
        >
          {revealedButton}
          <InfoIcon className="size-3.5 shrink-0" aria-hidden />
          <span className="sr-only">
            {WEREWOLF_COPY.roleDisplay.roleInfoLabel}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-64 text-wrap flex-col items-start"
        >
          {fullRole?.summary && (
            <p className="font-medium">{fullRole.summary}</p>
          )}
          {fullRole?.description && (
            <p className="mt-1 opacity-90">{fullRole.description}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
