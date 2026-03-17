"use client";

import { useCallback, useMemo } from "react";
import { WeatherMoonRegular } from "@fluentui/react-icons";
import { GAME_MODES } from "@/lib/game-modes";
import { WerewolfPhase, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import {
  GameRolesList,
  GameTimer,
  RoleGlossaryDialog,
} from "@/components/game";
import { OwnerAdvanceCard } from "./OwnerAdvanceCard";
import { NightOutcomeSummary } from "./NightOutcomeSummary";
import { OwnerPlayerActionsGrid } from "./OwnerPlayerActionsGrid";
import { OwnerTrialPanel } from "./OwnerTrialPanel";

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
  const dayPhaseSeconds = gameState.timerConfig?.dayPhaseSeconds;
  const votePhaseSeconds = gameState.timerConfig?.votePhaseSeconds;
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
  const activeTrial = phase.activeTrial;
  const hasActiveTrial = !!activeTrial && !activeTrial.verdict;
  const glossaryRoles = gameState.rolesInPlay?.length
    ? gameState.rolesInPlay
        .map((r) => modeConfig.roles[r.id])
        .filter((r) => r !== undefined)
    : Object.values(modeConfig.roles);

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">{`Day — Turn ${String(turnState.turn)}`}</h1>
      <GameTimer
        durationSeconds={dayPhaseSeconds}
        startedAt={phaseStartedAt}
        onTimerTrigger={handleAdvance}
        resetKey={turnState.turn}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <OwnerAdvanceCard
          label="Start Next Night"
          onAdvance={handleAdvance}
          disabled={action.isPending}
          icon={<WeatherMoonRegular />}
        >
          {activeTrial && (
            <OwnerTrialPanel
              gameId={gameId}
              activeTrial={activeTrial}
              players={gameState.players}
              votePhaseSeconds={votePhaseSeconds}
            />
          )}
        </OwnerAdvanceCard>
        <NightOutcomeSummary
          events={phase.nightResolution ?? []}
          players={gameState.players}
          roles={modeConfig.roles}
        />
      </div>
      <OwnerPlayerActionsGrid
        gameId={gameId}
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        deadPlayerIds={gameState.deadPlayerIds}
        gameOwnerId={gameState.gameOwner?.id}
        isDaytime
        hasActiveTrial={hasActiveTrial}
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
      <div className="mt-3">
        <RoleGlossaryDialog
          roles={glossaryRoles}
          gameMode={gameState.gameMode}
          title={WEREWOLF_COPY.glossary.dialogTitle}
          triggerLabel={WEREWOLF_COPY.glossary.openButton}
        />
      </div>
    </div>
  );
}
