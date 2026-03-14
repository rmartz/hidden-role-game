"use client";

import { useCallback, useMemo } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import { WerewolfPhase, WerewolfAction } from "@/lib/game-modes/werewolf";
import { getTargetablePlayers } from "@/lib/game-modes/werewolf";
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

export function OwnerGameNightScreen({ gameId, gameState, turnState }: Props) {
  const nightPhaseSeconds = gameState.timerConfig?.nightPhaseSeconds ?? null;
  const action = useGameAction(gameId);

  const { phase } = turnState;
  const isNighttime = phase.type === WerewolfPhase.Nighttime;
  const currentPhaseIndex = isNighttime ? phase.currentPhaseIndex : 0;
  const nightPhaseOrder = isNighttime ? phase.nightPhaseOrder : [];
  const isLastPhase = currentPhaseIndex === nightPhaseOrder.length - 1;

  const handleAdvance = useCallback(() => {
    if (isLastPhase) {
      action.mutate({ actionId: WerewolfAction.StartDay });
    } else {
      action.mutate({
        actionId: WerewolfAction.SetNightPhase,
        payload: { phaseIndex: currentPhaseIndex + 1 },
      });
    }
  }, [action, isLastPhase, currentPhaseIndex]);

  const phaseStartedAt = useMemo(
    () => new Date(isNighttime ? phase.startedAt : Date.now()),
    [isNighttime, phase.startedAt],
  );

  if (!isNighttime) return null;

  const nightActions = phase.nightActions;
  const activeRoleId = nightPhaseOrder[currentPhaseIndex] ?? "";
  const modeConfig = GAME_MODES[gameState.gameMode];
  const activeRoleName =
    (activeRoleId ? modeConfig.roles[activeRoleId]?.name : undefined) ??
    activeRoleId;

  const activeAction = nightActions[activeRoleId];
  const activeTarget = activeAction?.targetPlayerId;
  const activeTargetConfirmed = activeAction?.confirmed ?? false;
  const activeTargetName = activeTarget
    ? gameState.players.find((p) => p.id === activeTarget)?.name
    : undefined;

  const isFirstTurn = turnState.turn === 1;

  const targetablePlayers = getTargetablePlayers(
    gameState.players,
    gameState.gameOwner?.id,
    turnState.deadPlayerIds,
  );

  function handleTargetClick(playerId: string) {
    action.mutate({
      actionId: WerewolfAction.SetNightTarget,
      payload: {
        roleId: activeRoleId,
        targetPlayerId: activeTarget === playerId ? undefined : playerId,
      },
    });
  }

  const timer =
    nightPhaseSeconds !== null
      ? {
          durationSeconds: nightPhaseSeconds,
          startedAt: phaseStartedAt,
          onTimerTrigger: handleAdvance,
          resetKey: currentPhaseIndex,
        }
      : { startedAt: phaseStartedAt, resetKey: currentPhaseIndex };

  return (
    <div className="p-5">
      <OwnerHeader
        title={`Night — Turn ${String(turnState.turn)} (${String(currentPhaseIndex + 1)}/${String(nightPhaseOrder.length)})`}
        advanceLabel={isLastPhase ? "Start the Day" : "Next Role"}
        onAdvance={handleAdvance}
        isAdvancing={action.isPending}
        timer={timer}
      >
        <p className="mb-4 text-muted-foreground">
          Currently awake:{" "}
          <strong className="text-foreground">{activeRoleName}</strong>
        </p>
        {!isFirstTurn && (
          <div className="mb-4 rounded-md border p-3">
            <p className="text-sm font-medium mb-2">
              Target:{" "}
              {activeTargetName ? (
                <>
                  <strong className="text-foreground">
                    {activeTargetName}
                  </strong>
                  {activeTargetConfirmed && (
                    <span className="ml-1 text-xs text-green-600">
                      (confirmed)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground italic">none</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {targetablePlayers.map((player) => (
                <Button
                  key={player.id}
                  size="sm"
                  variant={activeTarget === player.id ? "default" : "outline"}
                  onClick={() => {
                    handleTargetClick(player.id);
                  }}
                  disabled={action.isPending}
                >
                  {player.name}
                </Button>
              ))}
            </div>
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
        selectedRoleId={activeRoleId}
        onSelectedIdChange={(roleId) => {
          const newIndex = nightPhaseOrder.indexOf(roleId);
          if (newIndex !== -1)
            action.mutate({
              actionId: WerewolfAction.SetNightPhase,
              payload: { phaseIndex: newIndex },
            });
        }}
      />
    </div>
  );
}
