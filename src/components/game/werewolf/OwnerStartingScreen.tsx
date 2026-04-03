"use client";

import { useMemo } from "react";
import { GameStatus } from "@/lib/types";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";
import { GameRolesList, PlayersRoleList } from "@/components/game";
import { OwnerHeader } from "./OwnerHeader";

interface OwnerStartingScreenProps {
  gameState: WerewolfPlayerGameState;
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

  const timerConfig = gameState.timerConfig;
  const timer = {
    durationSeconds: timerConfig.startCountdownSeconds,
    autoAdvance: timerConfig.autoAdvance,
    startedAt,
    onTimerTrigger: onStart,
  };

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <OwnerHeader
        title="Game Starting"
        advanceLabel="Start Now"
        onAdvance={onStart}
        timer={timer}
      />
      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        executionerTargetId={gameState.executionerTargetId}
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
