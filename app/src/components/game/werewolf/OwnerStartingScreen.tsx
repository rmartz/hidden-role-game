"use client";

import { GameStatus } from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import {
  GameRolesList,
  GameStartCountdown,
  PlayersRoleList,
} from "@/components/game";

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

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Game Starting</h1>
      <GameStartCountdown
        durationSeconds={durationSeconds}
        startedAtMs={startedAtMs}
        onComplete={onStart}
        allowSkip
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
