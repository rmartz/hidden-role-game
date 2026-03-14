"use client";

import { useCallback, useMemo } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import {
  WerewolfPhase,
  WerewolfAction,
  isTeamNightAction,
  isTeamPhaseKey,
  getTargetablePlayers,
} from "@/lib/game-modes/werewolf";
import type {
  WerewolfTurnState,
  AnyNightAction,
} from "@/lib/game-modes/werewolf";
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

function getPhaseLabel(
  phaseKey: string,
  modeConfig: { roles: Record<string, { name: string }> },
): string {
  if (isTeamPhaseKey(phaseKey)) {
    const teamName = phaseKey.slice("team:".length);
    return `${teamName} Team`;
  }
  return modeConfig.roles[phaseKey]?.name ?? phaseKey;
}

/** Extract a single target + confirmed state from any night action type. */
function getSoloTarget(action: AnyNightAction | undefined): {
  targetPlayerId: string | undefined;
  confirmed: boolean;
} {
  if (!action) return { targetPlayerId: undefined, confirmed: false };
  if (isTeamNightAction(action)) {
    return {
      targetPlayerId: action.suggestedTargetId,
      confirmed: action.confirmed ?? false,
    };
  }
  return {
    targetPlayerId: action.targetPlayerId,
    confirmed: action.confirmed ?? false,
  };
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
  const activePhaseKey = nightPhaseOrder[currentPhaseIndex] ?? "";
  const modeConfig = GAME_MODES[gameState.gameMode];
  const activePhaseLabel = getPhaseLabel(activePhaseKey, modeConfig);
  const isTeamPhase = isTeamPhaseKey(activePhaseKey);

  const activeAction = nightActions[activePhaseKey];
  const { targetPlayerId: activeTarget, confirmed: activeTargetConfirmed } =
    getSoloTarget(activeAction);
  const activeTargetName = activeTarget
    ? gameState.players.find((p) => p.id === activeTarget)?.name
    : undefined;

  const teamAction =
    isTeamPhase && activeAction && isTeamNightAction(activeAction)
      ? activeAction
      : undefined;

  const isFirstTurn = turnState.turn === 1;

  const targetablePlayers = getTargetablePlayers(
    gameState.players,
    gameState.gameOwner?.id,
    turnState.deadPlayerIds,
    activePhaseKey,
    null,
    gameState.visibleRoleAssignments,
  );

  function handleTargetClick(playerId: string) {
    action.mutate({
      actionId: WerewolfAction.SetNightTarget,
      payload: {
        roleId: activePhaseKey,
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
          <strong className="text-foreground">{activePhaseLabel}</strong>
        </p>
        {!isFirstTurn && (
          <div className="mb-4 rounded-md border p-3">
            {teamAction && (
              <div className="mb-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Votes:
                </p>
                {teamAction.votes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No votes yet
                  </p>
                ) : (
                  <ul className="text-xs space-y-0.5">
                    {teamAction.votes.map((vote) => {
                      const voterName =
                        gameState.players.find((p) => p.id === vote.playerId)
                          ?.name ?? vote.playerId;
                      const targetName =
                        gameState.players.find(
                          (p) => p.id === vote.targetPlayerId,
                        )?.name ?? vote.targetPlayerId;
                      return (
                        <li key={vote.playerId}>
                          {voterName} → {targetName}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
            <p className="text-sm font-medium mb-2">
              {teamAction ? "Suggested target: " : "Target: "}
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
        selectedRoleId={activePhaseKey}
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
