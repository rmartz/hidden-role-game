"use client";

import { useMemo } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import { GameStatus } from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import {
  GameRolesList,
  GameTimer,
  PlayersRoleList,
  RoleLabel,
} from "@/components/game";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface PlayerStartingScreenProps {
  gameState: PlayerGameState;
}

export function PlayerStartingScreen({ gameState }: PlayerStartingScreenProps) {
  const startedAtMs =
    gameState.status.type === GameStatus.Starting
      ? gameState.status.startedAt
      : undefined;
  const startedAt = useMemo(
    () => new Date(startedAtMs ?? Date.now()),
    [startedAtMs],
  );

  const fullRole = gameState.myRole
    ? GAME_MODES[gameState.gameMode].roles[gameState.myRole.id]
    : undefined;

  const roleDescription =
    (fullRole?.summary ?? fullRole?.description) ? (
      <div className="mt-2 text-sm space-y-1">
        {fullRole.summary && <p className="font-medium">{fullRole.summary}</p>}
        {fullRole.description && (
          <p className="text-muted-foreground">{fullRole.description}</p>
        )}
      </div>
    ) : null;

  const executionerTargetName = gameState.executionerTargetId
    ? gameState.players.find((p) => p.id === gameState.executionerTargetId)
        ?.name
    : undefined;

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Game Starting</h1>
      <GameTimer
        durationSeconds={gameState.timerConfig.startCountdownSeconds}
        autoAdvance={gameState.timerConfig.autoAdvance}
        startedAt={startedAt}
      />

      {gameState.myRole && (
        <div className="mb-5">
          <h2 className="text-lg font-semibold mb-2">Your Role</h2>
          <RoleLabel role={gameState.myRole} gameMode={gameState.gameMode} />
          {roleDescription}
          {executionerTargetName && (
            <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">
              {WEREWOLF_COPY.executioner.yourTarget(executionerTargetName)}
            </p>
          )}
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
