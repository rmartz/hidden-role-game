"use client";

import { useCallback, useMemo } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import { WerewolfPhase, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { GameRolesList } from "@/components/game";
import { NightActionsSummary } from "./NightActionsSummary";
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
  const nightResolution = phase.nightResolution ?? [];

  function phaseLabel(key: string): string {
    return key.startsWith("team:")
      ? key.slice(5) + " Team"
      : (modeConfig.roles[key]?.name ?? key);
  }

  const resolvedSummary = nightResolution.map((event) => ({
    playerName:
      gameState.players.find((p) => p.id === event.targetPlayerId)?.name ??
      event.targetPlayerId,
    attackerLabels: event.attackedBy.map(phaseLabel),
    protectorLabels: event.protectedBy.map(phaseLabel),
    died: event.died,
  }));
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
        <NightActionsSummary
          nightActions={phase.nightActions}
          players={gameState.players}
          roles={modeConfig.roles}
        />
        {resolvedSummary.length > 0 && (
          <div className="mb-4 rounded-md border p-3">
            <h2 className="text-sm font-semibold mb-2">Night Summary</h2>
            <ul className="space-y-1 text-sm">
              {resolvedSummary.map((entry, i) => (
                <li key={i}>
                  <strong className="text-foreground">
                    {entry.playerName}
                  </strong>
                  {entry.attackerLabels.length > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      — attacked by {entry.attackerLabels.join(", ")}
                    </span>
                  )}
                  {entry.protectorLabels.length > 0 && (
                    <span className="text-muted-foreground">
                      , protected by {entry.protectorLabels.join(", ")}
                    </span>
                  )}
                  <span
                    className={
                      entry.died
                        ? "ml-1 text-destructive font-medium"
                        : "ml-1 text-green-600 font-medium"
                    }
                  >
                    {entry.died ? "(killed)" : "(survived)"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
