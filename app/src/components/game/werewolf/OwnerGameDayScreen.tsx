"use client";

import { useCallback, useMemo } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import { WerewolfPhase, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { GameRolesList } from "@/components/game";
import { NightResolutionSummary } from "./NightResolutionSummary";
import { OwnerHeader } from "./OwnerHeader";
import { OwnerPlayerActionsGrid } from "./OwnerPlayerActionsGrid";

interface Props {
  gameId: string;
  gameState: PlayerGameState;
  turnState: WerewolfTurnState;
}

export function OwnerGameDayScreen({ gameId, gameState, turnState }: Props) {
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

  const timer =
    dayPhaseSeconds !== null
      ? {
          durationSeconds: dayPhaseSeconds,
          startedAt: phaseStartedAt,
          onTimerTrigger: handleAdvance,
          resetKey: turnState.turn,
        }
      : { startedAt: phaseStartedAt, resetKey: turnState.turn };

  return (
    <div className="p-5">
      <OwnerHeader
        title={`Day — Turn ${String(turnState.turn)}`}
        advanceLabel="Start Next Night"
        onAdvance={handleAdvance}
        isAdvancing={action.isPending}
        timer={timer}
      >
        <NightResolutionSummary
          nightResolution={phase.nightResolution ?? []}
          players={gameState.players}
          roles={modeConfig.roles}
        />
      </OwnerHeader>
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
