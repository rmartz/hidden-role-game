"use client";

import { useCallback, useMemo } from "react";
import {
  BedRegular,
  ClockWarningRegular,
  WeatherSunnyLowRegular,
} from "@fluentui/react-icons";
import { GAME_MODES } from "@/lib/game-modes";
import {
  WerewolfPhase,
  WerewolfAction,
  isTeamNightAction,
  isGroupPhaseKey,
  baseGroupPhaseKey,
  getTargetablePlayers,
  getPhaseLabel,
  getSoloTarget,
  TargetCategory,
  getInvestigationResultForNarrator,
} from "@/lib/game-modes/werewolf";
import { WerewolfRole } from "@/lib/game-modes/werewolf/roles";
import { isRoleActive } from "@/lib/game-modes/werewolf";
import type {
  WerewolfTurnState,
  WerewolfRoleDefinition,
} from "@/lib/game-modes/werewolf";
import { WEREWOLF_ROLES } from "@/lib/game-modes/werewolf/roles";
import type { PlayerGameState } from "@/server/types";
import { getPlayerName } from "@/lib/player-utils";
import { useGameAction } from "@/hooks";
import { GameTimer } from "@/components/game";
import { OwnerAdvanceCard } from "./OwnerAdvanceCard";
import { OwnerInvestigationConfirm } from "./OwnerInvestigationConfirm";
import { OwnerNightTargetPanel } from "./OwnerNightTargetPanel";
import { OwnerPlayerActionsGrid } from "./OwnerPlayerActionsGrid";
import { NightPhaseOrderList } from "./NightPhaseOrderList";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

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
  const action = useGameAction(gameId);

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
        const roleDef = (
          WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>
        )[a.role.id];
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

  const isActionConfirmed = isGroupPhase
    ? !!groupAction?.confirmed
    : activeTargetConfirmed;
  const isWitchAbilitySkipped =
    isRoleActive(activePhaseKey, WerewolfRole.Witch) &&
    turnState.witchAbilityUsed;

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
  const investigationResult = getInvestigationResultForNarrator(
    isInvestigatePhase,
    activeTarget,
    activeTargetConfirmed,
    activeTargetName,
    gameState.visibleRoleAssignments,
  );

  const unconfirmedWarning =
    !isFirstTurn && !isWitchAbilitySkipped && !isActionConfirmed
      ? WEREWOLF_COPY.narrator.playerUnconfirmed
      : investigationResult && !isResultRevealed
        ? WEREWOLF_COPY.narrator.investigationUnrevealed
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
      <GameTimer
        durationSeconds={timerConfig.nightPhaseSeconds}
        autoAdvance={timerConfig.autoAdvance}
        startedAt={phaseStartedAt}
        onTimerTrigger={handleAdvance}
        resetKey={currentPhaseIndex}
      />
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
          {!isFirstTurn &&
            (isRoleActive(activePhaseKey, WerewolfRole.Witch) &&
            turnState.witchAbilityUsed &&
            !activeTargetConfirmed ? (
              <p className="mb-4 text-sm text-muted-foreground italic">
                {WEREWOLF_COPY.night.witchAbilityUsed}
              </p>
            ) : (
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
      />
    </div>
  );
}
