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
import type {
  AnyNightAction,
  WerewolfRoleDefinition,
  WerewolfTurnState,
} from "@/lib/game/modes/werewolf";
import {
  baseGroupPhaseKey,
  getInvestigationResultForNarrator,
  getPhaseLabel,
  getSoloTarget,
  getTargetablePlayers,
  isGroupPhaseKey,
  isTeamNightAction,
  TargetCategory,
  WerewolfAction,
  WerewolfPhase,
} from "@/lib/game/modes/werewolf";
import { isRoleActive } from "@/lib/game/modes/werewolf";
import { buildNarratorInstruction } from "@/lib/game/modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { getWerewolfRole, WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import { getPlayerName } from "@/lib/player";

import { NarratorNightInstruction } from "./NarratorNightInstruction";
import { NightMarkerEffect } from "./NightActionMarker";
import { NightPhaseOrderList } from "./NightPhaseOrderList";
import { OwnerAdvanceCard } from "./OwnerAdvanceCard";
import { OwnerIlluminatiRevealPanel } from "./OwnerIlluminatiRevealPanel";
import { OwnerInvestigationConfirm } from "./OwnerInvestigationConfirm";
import { OwnerNightTargetPanel } from "./OwnerNightTargetPanel";
import { OwnerPlayerActionsGrid } from "./OwnerPlayerActionsGrid";
import { VeteranActionPanelView } from "./VeteranActionPanelView";

/**
 * Derives per-player night action status markers from the narrator's night actions.
 * A marker is added for any role action that has selected a target — including team
 * votes' `suggestedTargetId` and standing priest wards — regardless of whether the
 * action has been confirmed yet. Duplicate effects for the same player are deduped
 * so each effect appears at most once.
 */
function buildNightMarkers(
  nightActions: Record<string, AnyNightAction>,
  priestWards?: Record<string, string>,
  mirrorcasterCharged?: boolean,
): Map<string, NightMarkerEffect[]> {
  const markerSets = new Map<string, Set<NightMarkerEffect>>();

  const addMarker = (playerId: string, effect: NightMarkerEffect) => {
    const existing = markerSets.get(playerId);
    if (existing) {
      existing.add(effect);
    } else {
      markerSets.set(playerId, new Set([effect]));
    }
  };

  for (const [phaseKey, action] of Object.entries(nightActions)) {
    const targetId = isTeamNightAction(action)
      ? action.suggestedTargetId
      : action.targetPlayerId;
    if (!targetId) continue;

    if (isGroupPhaseKey(phaseKey)) {
      addMarker(targetId, NightMarkerEffect.Attacked);
      continue;
    }

    if (isRoleActive(phaseKey, WerewolfRole.Spellcaster)) {
      addMarker(targetId, NightMarkerEffect.Silenced);
      continue;
    }

    if (isRoleActive(phaseKey, WerewolfRole.Mummy)) {
      addMarker(targetId, NightMarkerEffect.Hypnotized);
      continue;
    }

    if (isRoleActive(phaseKey, WerewolfRole.Mirrorcaster)) {
      addMarker(
        targetId,
        mirrorcasterCharged
          ? NightMarkerEffect.Attacked
          : NightMarkerEffect.Protected,
      );
      continue;
    }

    const roleDef = getWerewolfRole(phaseKey);
    if (!roleDef) continue;

    switch (roleDef.targetCategory) {
      case TargetCategory.Attack:
        addMarker(targetId, NightMarkerEffect.Attacked);
        break;
      case TargetCategory.Protect:
        addMarker(targetId, NightMarkerEffect.Protected);
        break;
      case TargetCategory.Investigate:
        addMarker(targetId, NightMarkerEffect.Investigated);
        break;
      default:
        addMarker(targetId, NightMarkerEffect.Special);
    }

    // Mentalist investigates two players; mark the second target as well.
    if (
      isRoleActive(phaseKey, WerewolfRole.Mentalist) &&
      !isTeamNightAction(action) &&
      action.secondTargetPlayerId
    ) {
      addMarker(action.secondTargetPlayerId, NightMarkerEffect.Investigated);
    }
  }

  // Priest wards: mark all warded players as Protected.
  for (const wardedPlayerId of Object.keys(priestWards ?? {})) {
    addMarker(wardedPlayerId, NightMarkerEffect.Protected);
  }

  const markers = new Map<string, NightMarkerEffect[]>();
  for (const [playerId, effects] of markerSets) {
    markers.set(playerId, [...effects].sort());
  }
  return markers;
}

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

  if (!isNighttime) return null;

  const modeConfig = GAME_MODES[gameState.gameMode];
  const activePhaseLabel = getPhaseLabel(activePhaseKey, modeConfig.roles);
  const isGroupPhase = isGroupPhaseKey(activePhaseKey);
  // For suffixed repeat phases (e.g. "werewolf-werewolf:2"), strip the suffix
  // to match role IDs and look up role definitions.
  const baseActivePhaseKey = baseGroupPhaseKey(activePhaseKey);

  const activePlayerNames = gameState.visibleRoleAssignments
    .filter((a) => {
      // Narrator always receives role info (reason: "revealed"), but the
      // type allows role to be undefined for player-facing entries.
      if (!a.role) return false;
      if (a.role.id === baseActivePhaseKey) return true;
      if (isGroupPhase) {
        const roleDef = getWerewolfRole(a.role.id);
        return (
          (roleDef?.wakesWith as string | undefined) === baseActivePhaseKey
        );
      }
      return false;
    })
    .filter((a) => !turnState.deadPlayerIds.includes(a.player.id))
    .map((a) => getPlayerName(gameState.players, a.player.id) ?? a.player.id);

  const activeTargetName = activeTarget
    ? getPlayerName(gameState.players, activeTarget)
    : undefined;

  const groupAction =
    isGroupPhase && activeAction && isTeamNightAction(activeAction)
      ? activeAction
      : undefined;

  const isFirstTurn = turnState.turn === 1;
  const activeRoleIds = isFirstTurn
    ? new Set(
        gameState.visibleRoleAssignments.flatMap((a) =>
          a.role ? [a.role.id] : [],
        ),
      )
    : new Set<string>();
  const narratorInstruction = isFirstTurn
    ? buildNarratorInstruction(activePhaseKey, activeRoleIds)
    : undefined;

  const isActionConfirmed = isGroupPhase
    ? !!groupAction?.confirmed
    : activeTargetConfirmed;
  const isWitchAbilitySkipped =
    isRoleActive(activePhaseKey, WerewolfRole.Witch) &&
    turnState.roleState?.witch?.abilityUsed;

  const isVeteranPhase =
    !isFirstTurn && isRoleActive(activePhaseKey, WerewolfRole.Veteran);
  const veteranAction =
    isVeteranPhase && activeAction && !isTeamNightAction(activeAction)
      ? activeAction
      : undefined;
  const isVeteranAlerted = veteranAction?.alerted === true;
  const veteranHasDecided = veteranAction !== undefined;
  const narratorVeteranAlertsUsed =
    turnState.roleState?.veteran?.alertsUsed ?? 0;

  const activeRoleDef = modeConfig.roles[baseActivePhaseKey] as
    | WerewolfRoleDefinition
    | undefined;
  const isInvestigatePhase =
    activeRoleDef?.targetCategory === TargetCategory.Investigate;
  const isResultRevealed = !!(
    activeAction &&
    "resultRevealed" in activeAction &&
    activeAction.resultRevealed
  );

  const isIlluminatiPhase = activeRoleDef?.revealsFullRoleList === true;
  const isIlluminatiRevealed =
    isIlluminatiPhase &&
    !!(
      activeAction &&
      !isTeamNightAction(activeAction) &&
      activeAction.resultRevealed
    );

  const secondTargetId =
    activeAction && !isTeamNightAction(activeAction)
      ? activeAction.secondTargetPlayerId
      : undefined;
  const secondTargetName = secondTargetId
    ? (getPlayerName(gameState.players, secondTargetId) ?? secondTargetId)
    : undefined;

  const requiresDualTarget =
    activeRoleDef?.dualTargetSwap === true ||
    activeRoleDef?.dualTargetInvestigate === true;

  const dualTargetPrompt = activeRoleDef?.dualTargetSwap
    ? activeTarget !== undefined && secondTargetId !== undefined
      ? WEREWOLF_COPY.swapper.narratorTwoTargets(
          activeTargetName ?? activeTarget,
          secondTargetName ?? secondTargetId,
        )
      : activeTarget !== undefined
        ? WEREWOLF_COPY.swapper.narratorOneTarget
        : WEREWOLF_COPY.swapper.narratorNoTargets
    : activeRoleDef?.dualTargetInvestigate
      ? activeTarget !== undefined && secondTargetId !== undefined
        ? WEREWOLF_COPY.mentalist.narratorTwoTargets(
            activeTargetName ?? activeTarget,
            secondTargetName ?? secondTargetId,
          )
        : activeTarget !== undefined
          ? WEREWOLF_COPY.mentalist.narratorOneTarget
          : WEREWOLF_COPY.mentalist.narratorNoTargets
      : undefined;

  const investigationResult = getInvestigationResultForNarrator(
    isInvestigatePhase,
    activeTarget,
    activeTargetConfirmed,
    activeTargetName,
    gameState.visibleRoleAssignments,
    activeRoleDef,
    secondTargetId,
    secondTargetName,
  );

  const exposerRevealData = turnState.roleState?.exposer?.reveal;
  const exposerRevealText = exposerRevealData
    ? WEREWOLF_COPY.narrator.exposerRevealLabel(
        getPlayerName(gameState.players, exposerRevealData.playerId) ??
          exposerRevealData.playerId,
        gameState.visibleRoleAssignments.find(
          (a) => a.player.id === exposerRevealData.playerId,
        )?.role?.name ?? exposerRevealData.roleId,
      )
    : undefined;

  const unconfirmedWarning =
    !isFirstTurn && !isWitchAbilitySkipped && !isActionConfirmed
      ? WEREWOLF_COPY.narrator.playerUnconfirmed
      : investigationResult && !isResultRevealed
        ? WEREWOLF_COPY.narrator.investigationUnrevealed
        : isIlluminatiPhase && !isIlluminatiRevealed
          ? WEREWOLF_COPY.illuminati.revealUnconfirmed
          : undefined;

  const advanceIcon = unconfirmedWarning ? (
    <ClockWarningRegular />
  ) : isLastPhase ? (
    <WeatherSunnyLowRegular />
  ) : (
    <BedRegular />
  );

  const resolvedVotes = (groupAction?.votes ?? []).map((vote) => ({
    key: vote.playerId,
    voterName: getPlayerName(gameState.players, vote.playerId) ?? vote.playerId,
    targetName: vote.skipped
      ? "No target"
      : (getPlayerName(gameState.players, vote.targetPlayerId) ?? "Unknown"),
  }));

  // Cross-night exclusion for roles with preventRepeatTarget (Bodyguard, Spellcaster).
  // Within-night exclusion for suffixed repeat group phases (e.g. "werewolf-werewolf:2"):
  // the second phase cannot target whoever the first phase selected.
  const previousTargetId: string | undefined =
    activeRoleDef?.preventRepeatTarget
      ? turnState.lastTargets?.[baseActivePhaseKey]
      : baseActivePhaseKey !== activePhaseKey
        ? (() => {
            const baseAction = nightActions[baseActivePhaseKey];
            return baseAction && isTeamNightAction(baseAction)
              ? baseAction.suggestedTargetId
              : undefined;
          })()
        : undefined;

  const targetablePlayers = getTargetablePlayers(
    gameState.players,
    gameState.gameOwner?.id,
    turnState.deadPlayerIds,
    activePhaseKey,
    undefined,
    gameState.visibleRoleAssignments,
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
          unconfirmedWarning={unconfirmedWarning}
        >
          <p className="mb-4 text-muted-foreground">
            {WEREWOLF_COPY.narrator.currentlyAwake}{" "}
            <strong className="text-foreground">{activePhaseLabel}</strong>
            {activePlayerNames.length > 0 && (
              <span> ({activePlayerNames.join(", ")})</span>
            )}
          </p>
          {isFirstTurn && narratorInstruction && (
            <NarratorNightInstruction instruction={narratorInstruction} />
          )}
          {isRoleActive(activePhaseKey, WerewolfRole.Mirrorcaster) && (
            <p className="mb-3 text-sm text-muted-foreground italic">
              {turnState.roleState?.mirrorcaster?.charged
                ? WEREWOLF_COPY.mirrorcaster.narratorAttackMode
                : WEREWOLF_COPY.mirrorcaster.narratorProtectMode}
            </p>
          )}
          {!isFirstTurn && (
            <>
              {isWitchAbilitySkipped && !activeTargetConfirmed && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground italic mb-2">
                    {WEREWOLF_COPY.night.witchAbilityUsed}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        action.mutate({
                          actionId: WerewolfAction.ResetAbility,
                          payload: { roleId: WerewolfRole.Witch },
                        });
                      }}
                      disabled={action.isPending}
                    >
                      {WEREWOLF_COPY.narrator.restoreAbility}
                    </Button>
                    {!abilityBypass && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAbilityBypass(true);
                        }}
                      >
                        {WEREWOLF_COPY.narrator.bypassAbility}
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {isVeteranPhase ? (
                <VeteranActionPanelView
                  alertsUsed={narratorVeteranAlertsUsed}
                  isAlerted={isVeteranAlerted}
                  hasDecided={veteranHasDecided}
                  isConfirmed={isActionConfirmed}
                  isPending={action.isPending}
                  onAlert={handleVeteranAlert}
                  onSkip={handleVeteranSkip}
                  onConfirm={handleVeteranConfirm}
                />
              ) : (
                (!isWitchAbilitySkipped || abilityBypass) && (
                  <OwnerNightTargetPanel
                    groupAction={!!groupAction}
                    groupMemberCount={activePlayerNames.length}
                    resolvedVotes={resolvedVotes}
                    activeTargetName={activeTargetName}
                    activeTargetConfirmed={activeTargetConfirmed}
                    targetablePlayers={targetablePlayers}
                    activeTarget={activeTarget}
                    onTargetClick={handleTargetClick}
                    isPending={action.isPending}
                    previousTargetId={previousTargetId}
                    requiresDualTarget={requiresDualTarget}
                    secondTarget={secondTargetId}
                    dualTargetPrompt={dualTargetPrompt}
                  />
                )
              )}
            </>
          )}
          {investigationResult && (
            <OwnerInvestigationConfirm
              gameId={gameId}
              targetName={investigationResult.targetName}
              isWerewolfTeam={investigationResult.isWerewolfTeam}
              isResultRevealed={isResultRevealed}
              resultLabel={investigationResult.resultLabel}
              secondTargetName={investigationResult.secondTargetName}
            />
          )}
          {isIlluminatiPhase && (
            <OwnerIlluminatiRevealPanel
              gameId={gameId}
              players={gameState.players}
              roleAssignments={gameState.visibleRoleAssignments}
              isRevealed={isIlluminatiRevealed}
            />
          )}
          {exposerRevealText && (
            <p className="mt-2 text-xs text-muted-foreground italic">
              {exposerRevealText}
            </p>
          )}
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
