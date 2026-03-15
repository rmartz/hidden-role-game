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

      {gameState.nightSummary && gameState.nightSummary.length > 0 && (
        <div className="mb-5">
          <h2 className="text-lg font-semibold mb-2">Last Night</h2>
          <ul className="space-y-1">
            {gameState.nightSummary.map((event) => {
              const playerName =
                gameState.players.find((p) => p.id === event.targetPlayerId)
                  ?.name ?? event.targetPlayerId;
              return (
                <li key={event.targetPlayerId} className="text-sm">
                  {playerName} was eliminated.
                </li>
              );
            })}
          </ul>
          {gameState.myLastNightAction && (
            <p className="mt-2 text-sm text-muted-foreground">
              Your action was recorded: you targeted{" "}
              <strong>
                {gameState.players.find(
                  (p) => p.id === gameState.myLastNightAction?.targetPlayerId,
                )?.name ?? gameState.myLastNightAction.targetPlayerId}
              </strong>
              .
            </p>
          )}
        </div>
      )}

      {!gameState.nightSummary && gameState.myLastNightAction && (
        <div className="mb-5">
          <h2 className="text-lg font-semibold mb-2">Last Night</h2>
          <p className="text-sm text-muted-foreground">
            Nothing happened. Your action was recorded: you targeted{" "}
            <strong>
              {gameState.players.find(
                (p) => p.id === gameState.myLastNightAction?.targetPlayerId,
              )?.name ?? gameState.myLastNightAction.targetPlayerId}
            </strong>
            .
          </p>
        </div>
      )}

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
