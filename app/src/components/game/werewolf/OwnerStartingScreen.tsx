"use client";

import { useMemo } from "react";
import { GameStatus } from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import { GameRolesList, PlayersRoleList } from "@/components/game";
import { OwnerHeader } from "./OwnerHeader";

interface Props {
  gameState: PlayerGameState;
  onStart: () => void;
}

export function OwnerStartingScreen({ gameState, onStart }: Props) {
  const durationSeconds = gameState.timerConfig?.startCountdownSeconds ?? null;
  const startedAtMs =
    gameState.status.type === GameStatus.Starting
      ? gameState.status.startedAt
      : undefined;
  const startedAt = useMemo(
    () => new Date(startedAtMs ?? Date.now()),
    [startedAtMs],
  );

  const timer =
    durationSeconds !== null
      ? {
          durationSeconds,
          startedAt,
          onTimerTrigger: onStart,
          isPaused: false as const,
          onTogglePause: noop,
        }
      : { startedAt };

  return (
    <div className="p-5">
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

function noop() {
  // no-op: starting screen timer is not pausable
}
