"use client";

import { useCallback, useMemo } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import {
  WerewolfPhase,
  WerewolfAction,
  isTeamNightAction,
  isTeamPhaseKey,
  getTargetablePlayers,
  getPhaseLabel,
  getSoloTarget,
} from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { GameRolesList } from "@/components/game";
import { OwnerHeader } from "./OwnerHeader";
import { OwnerNightTargetPanel } from "./OwnerNightTargetPanel";
import { OwnerPlayerActionsGrid } from "./OwnerPlayerActionsGrid";

interface OwnerGameNightScreenProps {
  gameId: string;
  gameState: PlayerGameState;
  turnState: WerewolfTurnState;
}

export function OwnerGameNightScreen({
  gameId,
  gameState,
  turnState,
}: OwnerGameNightScreenProps) {
  const nightPhaseSeconds = gameState.timerConfig?.nightPhaseSeconds ?? null;
  const action = useGameAction(gameId);

  const { phase } = turnState;
  const isNighttime = phase.type === WerewolfPhase.Nighttime;
  const currentPhaseIndex = isNighttime ? phase.currentPhaseIndex : 0;
  const nightPhaseOrder = useMemo(
    () => (isNighttime ? phase.nightPhaseOrder : []),
    [isNighttime, phase],
  );
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

  const nightActions = phase.nightActions;
  const activePhaseKey = nightPhaseOrder[currentPhaseIndex] ?? "";
  const activeAction = nightActions[activePhaseKey];
  const { targetPlayerId: activeTarget, confirmed: activeTargetConfirmed } =
    getSoloTarget(activeAction);

  const handleTargetClick = useCallback(
    (playerId: string) => {
      action.mutate({
        actionId: WerewolfAction.SetNightTarget,
        payload: {
          roleId: activePhaseKey,
          targetPlayerId: activeTarget === playerId ? undefined : playerId,
        },
      });
    },
    [action, activePhaseKey, activeTarget],
  );

  const handlePhaseChange = useCallback(
    (roleId: string) => {
      const newIndex = nightPhaseOrder.indexOf(roleId);
      if (newIndex !== -1) {
        action.mutate({
          actionId: WerewolfAction.SetNightPhase,
          payload: { phaseIndex: newIndex },
        });
      }
    },
    [action, nightPhaseOrder],
  );

  if (!isNighttime) return null;

  const modeConfig = GAME_MODES[gameState.gameMode];
  const activePhaseLabel = getPhaseLabel(
    activePhaseKey,
    modeConfig.roles,
    modeConfig.teamLabels as Record<string, string>,
  );
  const isTeamPhase = isTeamPhaseKey(activePhaseKey);

  const activePlayerNames = gameState.visibleRoleAssignments
    .filter((a) =>
      isTeamPhase
        ? (a.role.team as string) === activePhaseKey.slice("team:".length)
        : a.role.id === activePhaseKey,
    )
    .filter((a) => !turnState.deadPlayerIds.includes(a.player.id))
    .map(
      (a) =>
        gameState.players.find((p) => p.id === a.player.id)?.name ??
        a.player.id,
    );

  const activeTargetName = activeTarget
    ? gameState.players.find((p) => p.id === activeTarget)?.name
    : undefined;

  const teamAction =
    isTeamPhase && activeAction && isTeamNightAction(activeAction)
      ? activeAction
      : undefined;

  const isFirstTurn = turnState.turn === 1;

  const resolvedVotes = (teamAction?.votes ?? []).map((vote) => ({
    key: vote.playerId,
    voterName:
      gameState.players.find((p) => p.id === vote.playerId)?.name ??
      vote.playerId,
    targetName:
      gameState.players.find((p) => p.id === vote.targetPlayerId)?.name ??
      vote.targetPlayerId,
  }));

  const targetablePlayers = getTargetablePlayers(
    gameState.players,
    gameState.gameOwner?.id,
    turnState.deadPlayerIds,
    activePhaseKey,
    null,
    gameState.visibleRoleAssignments,
  );

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
          {activePlayerNames.length > 0 && (
            <span> ({activePlayerNames.join(", ")})</span>
          )}
        </p>
        {!isFirstTurn && (
          <OwnerNightTargetPanel
            teamAction={!!teamAction}
            resolvedVotes={resolvedVotes}
            activeTargetName={activeTargetName}
            activeTargetConfirmed={activeTargetConfirmed}
            targetablePlayers={targetablePlayers}
            activeTarget={activeTarget}
            onTargetClick={handleTargetClick}
            isPending={action.isPending}
          />
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
        selectedRoleId={activePhaseKey}
        onSelectedIdChange={handlePhaseChange}
      />
    </div>
  );
}
