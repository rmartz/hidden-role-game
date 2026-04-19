"use client";

import { useMemo } from "react";
import { GAME_MODES } from "@/lib/game/modes";
import { GameStatus } from "@/lib/types";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import {
  GameRolesList,
  GameTimer,
  PlayersRoleList,
  RoleLabel,
} from "@/components/game";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

interface PlayerStartingScreenProps {
  gameState: WerewolfPlayerGameState;
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

  const isMason = gameState.myRole?.id === WerewolfRole.Mason;
  const masonInPlay =
    isMason ||
    gameState.rolesInPlay?.some((r) => r.id === (WerewolfRole.Mason as string));
  const masonWarning = masonInPlay
    ? isMason
      ? WEREWOLF_COPY.mason.playerWarning
      : WEREWOLF_COPY.mason.nonMasonWarning
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
        </div>
      )}

      {masonWarning && (
        <p className="mb-5 text-sm text-amber-700 dark:text-amber-400">
          {masonWarning}
        </p>
      )}

      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        myRoleId={gameState.myRole?.id}
        rolesInPlay={gameState.rolesInPlay}
      />

      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
