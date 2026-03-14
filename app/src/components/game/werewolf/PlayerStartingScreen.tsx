"use client";

import { useMemo } from "react";
import { GameStatus } from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import {
  GameRolesList,
  GameTimer,
  PlayersRoleList,
  RoleLabel,
} from "@/components/game";

interface Props {
  gameState: PlayerGameState;
}

export function PlayerStartingScreen({ gameState }: Props) {
  const durationSeconds = gameState.timerConfig?.startCountdownSeconds ?? null;
  const startedAtMs =
    gameState.status.type === GameStatus.Starting
      ? gameState.status.startedAt
      : undefined;
  const startedAt = useMemo(
    () => new Date(startedAtMs ?? Date.now()),
    [startedAtMs],
  );

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Game Starting</h1>
      {durationSeconds !== null ? (
        <GameTimer
          durationSeconds={durationSeconds}
          startedAt={startedAt}
          onTimerTrigger={noop}
        />
      ) : (
        <GameTimer startedAt={startedAt} />
      )}

      {gameState.myRole && (
        <div className="mb-5">
          <h2 className="text-lg font-semibold mb-2">Your Role</h2>
          <RoleLabel role={gameState.myRole} gameMode={gameState.gameMode} />
        </div>
      )}

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
  // no-op: player starting screen has no timer action
}
