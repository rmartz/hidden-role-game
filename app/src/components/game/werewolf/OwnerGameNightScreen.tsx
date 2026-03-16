"use client";

import { useCallback, useMemo } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import {
  WerewolfPhase,
  WerewolfAction,
  isTeamNightAction,
  isGroupPhaseKey,
  getTargetablePlayers,
  getPhaseLabel,
  getSoloTarget,
  TargetCategory,
  getInvestigationResultForNarrator,
} from "@/lib/game-modes/werewolf";
import { WerewolfRole } from "@/lib/game-modes/werewolf/roles";
import type {
  WerewolfTurnState,
  WerewolfRoleDefinition,
} from "@/lib/game-modes/werewolf";
import { WEREWOLF_ROLES } from "@/lib/game-modes/werewolf/roles";
import type { PlayerGameState } from "@/server/types";
import { getPlayerName } from "@/lib/player-utils";
import { useGameAction } from "@/hooks";
import { GameRolesList } from "@/components/game";
import { OwnerHeader } from "./OwnerHeader";
import { OwnerInvestigationConfirm } from "./OwnerInvestigationConfirm";
import { OwnerNightTargetPanel } from "./OwnerNightTargetPanel";
import { OwnerPlayerActionsGrid } from "./OwnerPlayerActionsGrid";
import { NightPhaseOrderList } from "./NightPhaseOrderList";

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
    (playerId: string | undefined) => {
      action.mutate({
        actionId: WerewolfAction.SetNightTarget,
        payload: {
          roleId: activePhaseKey,
          targetPlayerId: playerId,
        },
      });
    },
    [action, activePhaseKey],
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
  const activePhaseLabel = getPhaseLabel(activePhaseKey, modeConfig.roles);
  const isGroupPhase = isGroupPhaseKey(activePhaseKey);

  const activePlayerNames = gameState.visibleRoleAssignments
    .filter((a) => {
      if (a.role.id === activePhaseKey) return true;
      if (isGroupPhase) {
        const roleDef = (
          WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>
        )[a.role.id];
        return (roleDef?.wakesWith as string | undefined) === activePhaseKey;
      }
      return false;
    })
    .filter((a) => !turnState.deadPlayerIds.includes(a.player.id))
    .map((a) => getPlayerName(gameState.players, a.player.id) ?? a.player.id);

  const activeTargetName = activeTarget
    ? getPlayerName(gameState.players, activeTarget)
    : undefined;

  const teamAction =
    isGroupPhase && activeAction && isTeamNightAction(activeAction)
      ? activeAction
      : undefined;

  const isFirstTurn = turnState.turn === 1;

  const activeRoleDef = modeConfig.roles[activePhaseKey] as
    | WerewolfRoleDefinition
    | undefined;
  const isInvestigatePhase =
    activeRoleDef?.targetCategory === TargetCategory.Investigate;
  const isResultRevealed = !!(
    activeAction &&
    "resultRevealed" in activeAction &&
    activeAction.resultRevealed
  );
  const investigationResult = getInvestigationResultForNarrator(
    isInvestigatePhase,
    activeTarget,
    activeTargetConfirmed,
    activeTargetName,
    gameState.visibleRoleAssignments,
  );

  const resolvedVotes = (teamAction?.votes ?? []).map((vote) => ({
    key: vote.playerId,
    voterName: getPlayerName(gameState.players, vote.playerId) ?? vote.playerId,
    targetName:
      getPlayerName(gameState.players, vote.targetPlayerId) ??
      vote.targetPlayerId,
  }));

  const previousTargetId = activeRoleDef?.preventRepeatTarget
    ? turnState.lastTargets?.[activePhaseKey]
    : undefined;

  const targetablePlayers = getTargetablePlayers(
    gameState.players,
    gameState.gameOwner?.id,
    turnState.deadPlayerIds,
    activePhaseKey,
    undefined,
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
        {!isFirstTurn &&
          ((activePhaseKey as WerewolfRole) === WerewolfRole.Witch &&
          turnState.witchAbilityUsed &&
          !activeTargetConfirmed ? (
            <p className="mb-4 text-sm text-muted-foreground italic">
              The Witch has already used their special ability this game.
            </p>
          ) : (
            <OwnerNightTargetPanel
              teamAction={!!teamAction}
              resolvedVotes={resolvedVotes}
              activeTargetName={activeTargetName}
              activeTargetConfirmed={activeTargetConfirmed}
              targetablePlayers={targetablePlayers}
              activeTarget={activeTarget}
              onTargetClick={handleTargetClick}
              isPending={action.isPending}
              previousTargetId={previousTargetId}
            />
          ))}
        {investigationResult && (
          <OwnerInvestigationConfirm
            gameId={gameId}
            targetName={investigationResult.targetName}
            isWerewolfTeam={investigationResult.isWerewolfTeam}
            isResultRevealed={isResultRevealed}
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
      <NightPhaseOrderList
        nightPhaseOrder={nightPhaseOrder}
        currentPhaseIndex={currentPhaseIndex}
        roles={modeConfig.roles}
        teamLabels={modeConfig.teamLabels as Record<string, string>}
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
