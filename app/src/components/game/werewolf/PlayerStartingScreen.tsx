"use client";

import { GameStatus } from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import {
  GameRolesList,
  GameStartCountdown,
  PlayersRoleList,
  RoleLabel,
} from "@/components/game";

const DEFAULT_START_COUNTDOWN_SECONDS = 10;

interface Props {
  gameState: PlayerGameState;
}

export function PlayerStartingScreen({ gameState }: Props) {
  const durationSeconds = gameState.timerConfig
    ? gameState.timerConfig.startCountdownSeconds
    : DEFAULT_START_COUNTDOWN_SECONDS;
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
      />

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
