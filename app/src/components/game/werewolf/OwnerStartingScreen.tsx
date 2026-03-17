"use client";

import { useMemo } from "react";
import { GameStatus } from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import { GameRolesList, PlayersRoleList } from "@/components/game";
import { OwnerHeader } from "./OwnerHeader";

interface OwnerStartingScreenProps {
  gameState: PlayerGameState;
  onStart: () => void;
}

export function OwnerStartingScreen({
  gameState,
  onStart,
}: OwnerStartingScreenProps) {
  const startedAtMs =
    gameState.status.type === GameStatus.Starting
      ? gameState.status.startedAt
      : undefined;
  const startedAt = useMemo(
    () => new Date(startedAtMs ?? Date.now()),
    [startedAtMs],
  );

  const timer = {
    durationSeconds: gameState.timerConfig?.startCountdownSeconds,
    startedAt,
    onTimerTrigger: onStart,
  };

  return (
    <div className="p-5 max-w-lg mx-auto">
      <OwnerHeader
        title="Game Starting"
        advanceLabel="Start Now"
        onAdvance={onStart}
        timer={timer}
      />
      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
