"use client";

import {
  BedRegular,
  ClockWarningRegular,
  WeatherSunnyLowRegular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";

import { GameTimer } from "@/components/game";
import { Button } from "@/components/ui/button";
import { useGameAction } from "@/hooks";
import { GAME_MODES } from "@/lib/game/modes";
import type { WerewolfTurnState } from "@/lib/game/modes/werewolf";
import {
  getSoloTarget,
  WerewolfAction,
  WerewolfPhase,
} from "@/lib/game/modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";

import { NightPhaseOrderList } from "./NightPhaseOrderList";
import { OwnerAdvanceCard } from "./OwnerAdvanceCard";
import { deriveNightNarratorState } from "./OwnerGameNightScreen-derive";
import { buildNightMarkers } from "./OwnerGameNightScreen-helpers";
import { OwnerNightNarratorPanelView } from "./OwnerNightNarratorPanelView";
import { OwnerPlayerActionsGrid } from "./OwnerPlayerActionsGrid";

interface OwnerGameNightScreenProps {
  gameId: string;
  gameState: WerewolfPlayerGameState;
  turnState: WerewolfTurnState;
}

export function OwnerGameNightScreen({
  gameId,
  gameState,
  turnState,
}: OwnerGameNightScreenProps) {
  const action = useGameAction(gameId);
  const [abilityBypass, setAbilityBypass] = useState(false);

  const timerConfig = gameState.timerConfig;

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
  const nightStatusMarkers = useMemo(
    () =>
      isNighttime
        ? buildNightMarkers(
            nightActions,
            turnState.roleState?.priest?.wards,
            turnState.roleState?.mirrorcaster?.charged,
          )
        : undefined,
    [
      isNighttime,
      nightActions,
      turnState.roleState?.priest?.wards,
      turnState.roleState?.mirrorcaster?.charged,
    ],
  );
  const activePhaseKey = nightPhaseOrder[currentPhaseIndex] ?? "";
  useEffect(() => {
    setAbilityBypass(false);
  }, [activePhaseKey]);
  const activeAction = nightActions[activePhaseKey];
  const { targetPlayerId: activeTarget, confirmed: activeTargetConfirmed } =
    getSoloTarget(activeAction);

  const handleTargetClick = useCallback(
    (playerId: string | null | undefined, isSecondTarget?: boolean) => {
      action.mutate({
        actionId: WerewolfAction.SetNightTarget,
        payload: {
          roleId: activePhaseKey,
          targetPlayerId: playerId,
          isSecondTarget: isSecondTarget ?? false,
        },
      });
    },
    [action, activePhaseKey],
  );

  const handleVeteranAlert = useCallback(() => {
    action.mutate({
      actionId: WerewolfAction.SetNightTarget,
      payload: { roleId: activePhaseKey, alerted: true },
    });
  }, [action, activePhaseKey]);

  const handleVeteranSkip = useCallback(() => {
    action.mutate({
      actionId: WerewolfAction.SetNightTarget,
      payload: { roleId: activePhaseKey, targetPlayerId: null },
    });
  }, [action, activePhaseKey]);

  const handleVeteranConfirm = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.ConfirmNightTarget });
  }, [action]);

  const handleRestoreWitchAbility = useCallback(() => {
    action.mutate({
      actionId: WerewolfAction.ResetAbility,
      payload: { roleId: WerewolfRole.Witch },
    });
  }, [action]);

  const handleBypassWitchAbility = useCallback(() => {
    setAbilityBypass(true);
  }, []);

  if (!isNighttime) return null;

  const modeConfig = GAME_MODES[gameState.gameMode];
  const isFirstTurn = turnState.turn === 1;

  const narratorState = deriveNightNarratorState({
    gameState,
    turnState,
    modeConfig,
    activePhaseKey,
    activeAction,
    activeTarget,
    activeTargetConfirmed,
    nightActions,
    isFirstTurn,
  });

  const advanceIcon = narratorState.unconfirmedWarning ? (
    <ClockWarningRegular />
  ) : isLastPhase ? (
    <WeatherSunnyLowRegular />
  ) : (
    <BedRegular />
  );

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {WEREWOLF_COPY.narrator.nightTitle(
          turnState.turn,
          currentPhaseIndex + 1,
          nightPhaseOrder.length,
        )}
      </h1>
      <div className="flex items-center gap-3 mb-4">
        <GameTimer
          durationSeconds={timerConfig.nightPhaseSeconds}
          autoAdvance={timerConfig.autoAdvance}
          startedAt={phaseStartedAt}
          onTimerTrigger={handleAdvance}
          resetKey={currentPhaseIndex}
          pausedAt={
            phase.pausedAt !== undefined ? new Date(phase.pausedAt) : undefined
          }
          pauseOffset={phase.pauseOffset ?? 0}
        />
        {phase.pausedAt !== undefined ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              action.mutate({ actionId: WerewolfAction.ResumeTimer });
            }}
            disabled={action.isPending}
          >
            {WEREWOLF_COPY.narrator.resumeTimer}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              action.mutate({ actionId: WerewolfAction.PauseTimer });
            }}
            disabled={action.isPending}
          >
            {WEREWOLF_COPY.narrator.pauseTimer}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <OwnerAdvanceCard
          label={
            isLastPhase
              ? WEREWOLF_COPY.narrator.startDay
              : WEREWOLF_COPY.narrator.nextRole
          }
          onAdvance={handleAdvance}
          disabled={action.isPending}
          icon={advanceIcon}
          unconfirmedWarning={narratorState.unconfirmedWarning}
        >
          <OwnerNightNarratorPanelView
            gameId={gameId}
            activePhaseKey={activePhaseKey}
            activePhaseLabel={narratorState.activePhaseLabel}
            activePlayerNames={narratorState.activePlayerNames}
            isFirstTurn={isFirstTurn}
            narratorInstruction={narratorState.narratorInstruction}
            mercenaryCharged={narratorState.mercenaryCharged}
            mirrorcasterCharged={narratorState.mirrorcasterCharged}
            isWitchAbilitySkipped={narratorState.isWitchAbilitySkipped}
            activeTargetConfirmed={activeTargetConfirmed}
            abilityBypass={abilityBypass}
            onRestoreWitchAbility={handleRestoreWitchAbility}
            onBypassWitchAbility={handleBypassWitchAbility}
            isVeteranPhase={narratorState.isVeteranPhase}
            veteranAlertsUsed={narratorState.veteranAlertsUsed}
            isVeteranAlerted={narratorState.isVeteranAlerted}
            veteranHasDecided={narratorState.veteranHasDecided}
            isActionConfirmed={narratorState.isActionConfirmed}
            onVeteranAlert={handleVeteranAlert}
            onVeteranSkip={handleVeteranSkip}
            onVeteranConfirm={handleVeteranConfirm}
            isEvilEmpathPhase={narratorState.isEvilEmpathPhase}
            hasGroupAction={narratorState.hasGroupAction}
            groupMemberCount={narratorState.activePlayerNames.length}
            resolvedVotes={narratorState.resolvedVotes}
            activeTargetName={narratorState.activeTargetName}
            targetablePlayers={narratorState.targetablePlayers}
            activeTarget={activeTarget}
            onTargetClick={handleTargetClick}
            previousTargetId={narratorState.previousTargetId}
            requiresDualTarget={narratorState.requiresDualTarget}
            secondTargetId={narratorState.secondTargetId}
            dualTargetPrompt={narratorState.dualTargetPrompt}
            investigationResult={narratorState.investigationResult}
            isResultRevealed={narratorState.isResultRevealed}
            isIlluminatiPhase={narratorState.isIlluminatiPhase}
            illuminatiPlayers={gameState.players}
            illuminatiRoleAssignments={gameState.visibleRoleAssignments}
            isIlluminatiRevealed={narratorState.isIlluminatiRevealed}
            exposerRevealText={narratorState.exposerRevealText}
            evilEmpathNightResult={narratorState.evilEmpathNightResult}
            isPending={action.isPending}
          />
        </OwnerAdvanceCard>
        <NightPhaseOrderList
          nightPhaseOrder={nightPhaseOrder}
          currentPhaseIndex={currentPhaseIndex}
          roles={modeConfig.roles}
        />
      </div>
      <OwnerPlayerActionsGrid
        gameId={gameId}
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        deadPlayerIds={gameState.deadPlayerIds}
        gameOwnerId={gameState.gameOwner?.id}
        smitedPlayerIds={phase.smitedPlayerIds}
        executionerTargetId={gameState.executionerTargetId}
        nightStatusMarkers={nightStatusMarkers}
      />
    </div>
  );
}
