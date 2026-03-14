"use client";

import { useCallback, useMemo, useState } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import { WerewolfPhase, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { GameRolesList, PlayersRoleList } from "@/components/game";
import { Button } from "@/components/ui/button";
import { OwnerHeader } from "./OwnerHeader";

interface Props {
  gameId: string;
  gameState: PlayerGameState;
  turnState: WerewolfTurnState;
}

export function OwnerGameDayScreen({ gameId, gameState, turnState }: Props) {
  const dayPhaseSeconds = gameState.timerConfig?.dayPhaseSeconds ?? null;
  const action = useGameAction(gameId);
  const [isPaused, setIsPaused] = useState(false);

  const handleAdvance = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.StartNight });
  }, [action]);

  const { phase } = turnState;
  const phaseStartedAt = useMemo(
    () =>
      new Date(
        phase.type === WerewolfPhase.Daytime ? phase.startedAt : Date.now(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase.type === WerewolfPhase.Daytime ? phase.startedAt : 0],
  );

  if (phase.type !== WerewolfPhase.Daytime) return null;

  // Build night summary: group by targeted player → list of roles that targeted them.
  const modeConfig = GAME_MODES[gameState.gameMode];
  const nightActions = phase.nightActions;
  const targetSummary = new Map<string, string[]>();
  for (const [roleId, { targetPlayerId }] of Object.entries(nightActions)) {
    const roleName = modeConfig.roles[roleId]?.name ?? roleId;
    const existing = targetSummary.get(targetPlayerId) ?? [];
    existing.push(roleName);
    targetSummary.set(targetPlayerId, existing);
  }
  const hasTargets = targetSummary.size > 0;

  const timer =
    dayPhaseSeconds !== null
      ? {
          durationSeconds: dayPhaseSeconds,
          startedAt: phaseStartedAt,
          isPaused,
          onTimerTrigger: handleAdvance,
          onTogglePause: setIsPaused,
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
        {hasTargets && (
          <div className="mb-4 rounded-md border p-3">
            <h2 className="text-sm font-semibold mb-2">Night Summary</h2>
            <ul className="space-y-1 text-sm">
              {[...targetSummary.entries()].map(([playerId, roleNames]) => {
                const playerName =
                  gameState.players.find((p) => p.id === playerId)?.name ??
                  playerId;
                return (
                  <li key={playerId}>
                    <strong className="text-foreground">{playerName}</strong>
                    <span className="text-muted-foreground">
                      {" "}
                      — targeted by {roleNames.join(", ")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </OwnerHeader>
      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        deadPlayerIds={gameState.deadPlayerIds}
        renderActions={(playerId, isDead) =>
          playerId !== gameState.gameOwner?.id &&
          (isDead ? (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                action.mutate({
                  actionId: WerewolfAction.MarkPlayerAlive,
                  payload: { playerId },
                });
              }}
              disabled={action.isPending}
            >
              Revive
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="xs"
              onClick={() => {
                if (window.confirm("Mark this player as dead?")) {
                  action.mutate({
                    actionId: WerewolfAction.MarkPlayerDead,
                    payload: { playerId },
                  });
                }
              }}
              disabled={action.isPending}
            >
              Kill
            </Button>
          ))
        }
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
