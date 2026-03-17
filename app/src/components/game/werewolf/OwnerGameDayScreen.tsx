"use client";

import { useCallback, useMemo } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import { WerewolfPhase, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { GameRolesList, GameTimer } from "@/components/game";
import { OwnerAdvanceCard } from "./OwnerAdvanceCard";
import { NightOutcomeSummary } from "./NightOutcomeSummary";
import { OwnerPlayerActionsGrid } from "./OwnerPlayerActionsGrid";

interface OwnerGameDayScreenProps {
  gameId: string;
  gameState: PlayerGameState;
  turnState: WerewolfTurnState;
}

export function OwnerGameDayScreen({
  gameId,
  gameState,
  turnState,
}: OwnerGameDayScreenProps) {
  const dayPhaseSeconds = gameState.timerConfig?.dayPhaseSeconds ?? null;
  const action = useGameAction(gameId);

  const handleAdvance = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.StartNight });
  }, [action]);

  const { phase } = turnState;
  const isDaytime = phase.type === WerewolfPhase.Daytime;

  const phaseStartedAt = useMemo(
    () => new Date(isDaytime ? phase.startedAt : Date.now()),
    [isDaytime, phase.startedAt],
  );

  if (!isDaytime) return null;

  const modeConfig = GAME_MODES[gameState.gameMode];

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">{`Day — Turn ${String(turnState.turn)}`}</h1>
      {dayPhaseSeconds !== null ? (
        <GameTimer
          durationSeconds={dayPhaseSeconds}
          startedAt={phaseStartedAt}
          onTimerTrigger={handleAdvance}
          resetKey={turnState.turn}
        />
      ) : (
        <GameTimer startedAt={phaseStartedAt} resetKey={turnState.turn} />
      )}
      <OwnerAdvanceCard
        label="Start Next Night"
        onAdvance={handleAdvance}
        disabled={action.isPending}
      >
        <NightOutcomeSummary
          events={phase.nightResolution ?? []}
          players={gameState.players}
          roles={modeConfig.roles}
        />
      </OwnerAdvanceCard>
      <OwnerPlayerActionsGrid
        gameId={gameId}
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        deadPlayerIds={gameState.deadPlayerIds}
        gameOwnerId={gameState.gameOwner?.id}
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
