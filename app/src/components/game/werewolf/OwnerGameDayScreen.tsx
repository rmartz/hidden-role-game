"use client";

import { useCallback, useMemo } from "react";
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

  // Build night summary: group by targeted player → list of roles that targeted them.
  const modeConfig = GAME_MODES[gameState.gameMode];
  const nightActions = phase.nightActions;
  const targetSummary = new Map<string, string[]>();
  for (const [phaseKey, action] of Object.entries(nightActions)) {
    if ("targetPlayerId" in action) {
      const roleName = modeConfig.roles[phaseKey]?.name ?? phaseKey;
      const existing = targetSummary.get(action.targetPlayerId) ?? [];
      existing.push(roleName);
      targetSummary.set(action.targetPlayerId, existing);
    } else if ("votes" in action && action.suggestedTargetId) {
      // Team phase: use the agreed target.
      const label = phaseKey.startsWith("team:")
        ? phaseKey.slice(5) + " Team"
        : phaseKey;
      const existing = targetSummary.get(action.suggestedTargetId) ?? [];
      existing.push(label);
      targetSummary.set(action.suggestedTargetId, existing);
    }
  }
  const hasTargets = targetSummary.size > 0;

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
