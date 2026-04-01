"use client";

import { useCallback, useMemo } from "react";
import { WeatherMoonRegular } from "@fluentui/react-icons";
import { GAME_MODES } from "@/lib/game-modes";
import { WerewolfPhase, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";
import {
  WEREWOLF_ROLE_CATEGORY_LABELS,
  WEREWOLF_ROLE_CATEGORY_ORDER,
} from "@/lib/game-modes/werewolf/roles";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import {
  GameRolesList,
  GameTimer,
  RoleGlossaryDialog,
} from "@/components/game";
import { Button } from "@/components/ui/button";
import { OwnerAdvanceCard } from "./OwnerAdvanceCard";
import { NightOutcomeSummary } from "./NightOutcomeSummary";
import { NominationPanel } from "./NominationPanel";
import { OwnerPlayerActionsGrid } from "./OwnerPlayerActionsGrid";
import { OwnerTrialPanel } from "./OwnerTrialPanel";
import { HunterRevengePanel } from "./HunterRevengePanel";

interface OwnerGameDayScreenProps {
  gameId: string;
  gameState: PlayerGameState;
  turnState: WerewolfTurnState;
}

export function OwnerGameDayScreen({
  gameId,
  gameState,
  turnState,
}: OwnerGameDayScreenProps) {
  const timerConfig = gameState.timerConfig;
  const {
    dayPhaseSeconds,
    votePhaseSeconds,
    defensePhaseSeconds,
    autoAdvance,
  } = timerConfig;

  const action = useGameAction(gameId);

  const handleAdvance = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.StartNight });
  }, [action]);

  const handleEndGame = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.EndGame });
  }, [action]);

  const { phase } = turnState;
  const isDaytime = phase.type === WerewolfPhase.Daytime;

  const phaseStartedAt = useMemo(
    () => new Date(isDaytime ? phase.startedAt : Date.now()),
    [isDaytime, phase.startedAt],
  );

  if (!isDaytime) return null;

  const daytimePhase = phase;
  const modeConfig = GAME_MODES[gameState.gameMode];
  const activeTrial = daytimePhase.activeTrial;
  const hasActiveTrial = !!activeTrial && !activeTrial.verdict;
  const trialConcluded = !!activeTrial?.verdict;
  const nominationsBlocked =
    hasActiveTrial || (gameState.singleTrialPerDay && trialConcluded);
  const hunterRevengePending = !!gameState.hunterRevengePlayerId;
  const glossaryRoles = gameState.rolesInPlay?.length
    ? gameState.rolesInPlay
        .map((r) => modeConfig.roles[r.id])
        .filter((r) => r !== undefined)
    : Object.values(modeConfig.roles);

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-bold">{`Day — Turn ${String(turnState.turn)}`}</h1>
        <RoleGlossaryDialog
          roles={glossaryRoles}
          gameMode={gameState.gameMode}
          title={WEREWOLF_COPY.glossary.dialogTitle}
          triggerLabel={WEREWOLF_COPY.glossary.openButton}
          categoryOrder={WEREWOLF_ROLE_CATEGORY_ORDER}
          categoryLabels={WEREWOLF_ROLE_CATEGORY_LABELS}
        />
      </div>
      <GameTimer
        durationSeconds={dayPhaseSeconds}
        autoAdvance={autoAdvance}
        startedAt={phaseStartedAt}
        onTimerTrigger={handleAdvance}
        resetKey={turnState.turn}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <OwnerAdvanceCard
          label="Start Next Night"
          onAdvance={handleAdvance}
          disabled={action.isPending || hunterRevengePending}
          icon={<WeatherMoonRegular />}
        >
          {activeTrial && (
            <OwnerTrialPanel
              gameId={gameId}
              activeTrial={activeTrial}
              players={gameState.players}
              votePhaseSeconds={votePhaseSeconds}
              defensePhaseSeconds={defensePhaseSeconds}
              autoAdvance={autoAdvance}
            />
          )}
        </OwnerAdvanceCard>
        <NightOutcomeSummary
          events={daytimePhase.nightResolution ?? []}
          players={gameState.players}
          roles={modeConfig.roles}
        />
      </div>
      {gameState.hunterRevengePlayerId && (
        <div className="mb-5">
          <HunterRevengePanel
            gameId={gameId}
            hunterRevengePlayerId={gameState.hunterRevengePlayerId}
            players={gameState.players}
            deadPlayerIds={gameState.deadPlayerIds ?? []}
          />
        </div>
      )}
      {gameState.nominationsEnabled && !nominationsBlocked && (
        <NominationPanel
          gameId={gameId}
          players={gameState.players}
          nominations={gameState.nominations ?? []}
          deadPlayerIds={gameState.deadPlayerIds}
          gameOwnerId={gameState.gameOwner?.id}
        />
      )}
      <OwnerPlayerActionsGrid
        gameId={gameId}
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        deadPlayerIds={gameState.deadPlayerIds}
        gameOwnerId={gameState.gameOwner?.id}
        isDaytime
        trialBlocked={nominationsBlocked}
        executionerTargetId={gameState.executionerTargetId}
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
      <div className="mt-3">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleEndGame}
          disabled={action.isPending}
        >
          {WEREWOLF_COPY.gameOver.endGame}
        </Button>
      </div>
    </div>
  );
}
