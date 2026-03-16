"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { GameMode } from "@/lib/types";
import type { PublicRoleInfo } from "@/server/types";
import { RoleLabel } from "@/components/RoleLabel";
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

  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold mb-2">
        {WEREWOLF_COPY.roleDisplay.yourRole}
      </h2>
      {revealed ? (
        <div>
          <RoleLabel role={role} gameMode={gameMode} />
          <p className="text-xs text-muted-foreground mt-1">
            {WEREWOLF_COPY.roleDisplay.hidesAutomatically}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-auto p-0 text-xs text-muted-foreground"
            onClick={() => {
              setRevealed(false);
            }}
          >
            {WEREWOLF_COPY.roleDisplay.hide}
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => {
            setRevealed(true);
          }}
        >
          {WEREWOLF_COPY.roleDisplay.revealRole}
        </Button>
      )}
    </div>
  );
}
