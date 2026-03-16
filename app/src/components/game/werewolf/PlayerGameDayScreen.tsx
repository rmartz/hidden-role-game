"use client";

import { useMemo } from "react";
import { WerewolfPhase } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { GameTimer } from "@/components/game";
import { PlayerNightSummary } from "./PlayerNightSummary";
import { PlayerRoleDisplay } from "./PlayerRoleDisplay";
import { PlayerStatusLists } from "./PlayerStatusLists";

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
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-bold">Hidden Role Game</h1>
        {gameState.myRole && (
          <PlayerRoleDisplay
            role={gameState.myRole}
            gameMode={gameState.gameMode}
          />
        )}
      </div>
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

      <PlayerNightSummary
        players={gameState.players}
        nightStatus={gameState.nightStatus}
      />

      {gameState.amDead && (
        <p className="mb-4 font-semibold text-muted-foreground italic">
          You have been eliminated.
        </p>
      )}

      <PlayerStatusLists
        players={gameState.players}
        deadPlayerIds={turnState.deadPlayerIds}
        gameOwnerId={gameState.gameOwner?.id}
        roleAssignments={gameState.visibleRoleAssignments}
      />
    </div>
  );
}

function noop() {
  // no-op: player day screen has no timer action
}
