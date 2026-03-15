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

  const modeConfig = GAME_MODES[gameState.gameMode];

  function phaseLabel(phaseKey: string): string {
    return phaseKey.startsWith("team:")
      ? phaseKey.slice(5) + " Team"
      : (modeConfig.roles[phaseKey]?.name ?? phaseKey);
  }

  function targetPlayerIdOf(
    a: (typeof phase.nightActions)[string],
  ): string | undefined {
    if ("targetPlayerId" in a) return a.targetPlayerId;
    if ("votes" in a && a.suggestedTargetId) return a.suggestedTargetId;
    return undefined;
  }

  const targetSummaryEntries = Object.entries(phase.nightActions)
    .flatMap(([phaseKey, a]) => {
      const targetId = targetPlayerIdOf(a);
      return targetId ? [{ targetId, label: phaseLabel(phaseKey) }] : [];
    })
    .reduce<{ targetId: string; playerName: string; labels: string[] }[]>(
      (acc, { targetId, label }) => {
        const existing = acc.find((e) => e.targetId === targetId);
        if (existing) {
          existing.labels.push(label);
        } else {
          const playerName =
            gameState.players.find((p) => p.id === targetId)?.name ?? targetId;
          acc.push({ targetId, playerName, labels: [label] });
        }
        return acc;
      },
      [],
    );

  function renderPlayerActions(playerId: string, isDead: boolean) {
    if (playerId === gameState.gameOwner?.id) return null;
    if (isDead) {
      return (
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
      );
    }
    return (
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
    );
  }

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
        {targetSummaryEntries.length > 0 && (
          <div className="mb-4 rounded-md border p-3">
            <h2 className="text-sm font-semibold mb-2">Night Summary</h2>
            <ul className="space-y-1 text-sm">
              {targetSummaryEntries.map(({ targetId, playerName, labels }) => (
                <li key={targetId}>
                  <strong className="text-foreground">{playerName}</strong>
                  <span className="text-muted-foreground">
                    {" "}
                    — targeted by {labels.join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </OwnerHeader>
      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        deadPlayerIds={gameState.deadPlayerIds}
        renderActions={renderPlayerActions}
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
