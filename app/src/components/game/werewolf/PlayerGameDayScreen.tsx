"use client";

import { useMemo } from "react";
import { WerewolfPhase } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import {
  GameRolesList,
  GameTimer,
  PlayersRoleList,
  RoleLabel,
} from "@/components/game";

interface Props {
  gameState: PlayerGameState;
  turnState: WerewolfTurnState;
}

export function PlayerGameDayScreen({ gameState, turnState }: Props) {
  const dayPhaseSeconds = gameState.timerConfig?.dayPhaseSeconds ?? null;
  const { phase } = turnState;
  const isDaytime = phase.type === WerewolfPhase.Daytime;
  const phaseStartedAt = useMemo(
    () => new Date(isDaytime ? phase.startedAt : Date.now()),
    [isDaytime, phase.startedAt],
  );

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-2">Hidden Role Game</h1>
      {dayPhaseSeconds !== null ? (
        <GameTimer
          durationSeconds={dayPhaseSeconds}
          startedAt={phaseStartedAt}
          onTimerTrigger={noop}
        />
      ) : (
        <GameTimer startedAt={phaseStartedAt} />
      )}
      <p className="mb-4 text-muted-foreground">The game is underway.</p>

      {gameState.amDead && (
        <p className="mb-4 font-semibold text-muted-foreground italic">
          You have been eliminated.
        </p>
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
        deadPlayerIds={gameState.deadPlayerIds}
      />

      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}

function noop() {
  // no-op: player day screen has no timer action
}
