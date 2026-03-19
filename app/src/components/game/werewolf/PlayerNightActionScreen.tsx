"use client";

import { useMemo } from "react";
import {
  getTargetablePlayers,
  isGroupPhaseKey,
} from "@/lib/game-modes/werewolf";
import type { WerewolfNighttimePhase } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { getPlayerName } from "@/lib/player-utils";
import { GameTimer } from "@/components/game";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";
import { ConfirmTargetButton } from "./ConfirmTargetButton";
import { PlayerFirstTurnScreen } from "./PlayerFirstTurnScreen";
import { PlayerInvestigationResult } from "./PlayerInvestigationResult";
import { PlayerTargetSelection } from "./PlayerTargetSelection";

interface PlayerNightActionScreenProps {
  gameId: string;
  gameState: PlayerGameState;
  phase: WerewolfNighttimePhase;
  turn: number;
  deadPlayerIds: string[];
}

export function PlayerNightActionScreen({
  gameId,
  gameState,
  phase,
  turn,
  deadPlayerIds,
}: PlayerNightActionScreenProps) {
  const phaseStartedAt = useMemo(
    () => new Date(phase.startedAt),
    [phase.startedAt],
  );

  const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
  const isFirstTurn = turn === 1;
  const priestWardActive = gameState.priestWardActive ?? false;
  const isGroupPhase = !!(activePhaseKey && isGroupPhaseKey(activePhaseKey));
  const teammateNames = gameState.visibleRoleAssignments.map(
    (a) => a.player.name,
  );

  const isConfirmed = gameState.myNightTargetConfirmed ?? false;
  const hasVisibleTeammates =
    isGroupPhase &&
    gameState.visibleRoleAssignments.some(
      (a) => !deadPlayerIds.includes(a.player.id),
    );
  const resolvedTeamVotes = (gameState.teamVotes ?? []).map((vote) => ({
    playerName: vote.playerName,
    targetName:
      "skipped" in vote
        ? "No target"
        : (getPlayerName(gameState.players, vote.targetPlayerId) ?? "Unknown"),
  }));
  const suggestedTargetId = gameState.suggestedTargetId;
  const allAgreed = gameState.allAgreed ?? false;

  const allTargets = getTargetablePlayers(
    gameState.players,
    gameState.gameOwner?.id,
    deadPlayerIds,
    activePhaseKey ?? "",
    gameState.myPlayerId,
    gameState.visibleRoleAssignments,
  ).map((player) => [player, gameState.myNightTarget === player.id] as const);

  const targets = isConfirmed
    ? allTargets.filter(([, isSelected]) => isSelected)
    : allTargets;

  // For group phases (Werewolf, Wolf Cub waking together), use the phase key;
  // solo phases use the player's own role ID.
  const confirmPhaseKey = isGroupPhase ? activePhaseKey : gameState.myRole?.id;

  const attackedPlayerIds = (gameState.nightStatus ?? [])
    .filter((e) => e.effect === "attacked")
    .map((e) => e.targetPlayerId);

  return isFirstTurn ? (
    <PlayerFirstTurnScreen
      roleName={gameState.myRole?.name}
      teammateNames={teammateNames}
    />
  ) : (
    <div className="p-5">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-2">
          {WEREWOLF_COPY.night.yourTurn}
        </h1>
        <GameTimer
          durationSeconds={gameState.timerConfig.nightPhaseSeconds}
          autoAdvance={gameState.timerConfig.autoAdvance}
          startedAt={phaseStartedAt}
          resetKey={phase.currentPhaseIndex}
        />
        <p className="text-muted-foreground mb-4">
          {priestWardActive
            ? WEREWOLF_COPY.night.priestWardActive
            : WEREWOLF_COPY.night.wakeUp}
        </p>
        {priestWardActive ? (
          <ConfirmTargetButton
            gameId={gameId}
            roleId={confirmPhaseKey}
            hasTarget={false}
            hasDecided
            isConfirmed={isConfirmed}
          />
        ) : (
          <PlayerTargetSelection
            gameId={gameId}
            players={gameState.players}
            targets={targets}
            isConfirmed={isConfirmed}
            isGroupPhase={isGroupPhase}
            confirmPhaseKey={confirmPhaseKey}
            hasTarget={!!gameState.myNightTarget}
            allAgreed={allAgreed}
            hasVisibleTeammates={hasVisibleTeammates}
            teamVotes={resolvedTeamVotes}
            suggestedTargetId={suggestedTargetId}
            myNightTarget={gameState.myNightTarget}
            witchAbilityUsed={gameState.witchAbilityUsed}
            attackedPlayerIds={attackedPlayerIds}
            previousNightTargetId={gameState.previousNightTargetId}
          />
        )}
        {gameState.investigationResult && (
          <PlayerInvestigationResult
            targetName={
              getPlayerName(
                gameState.players,
                gameState.investigationResult.targetPlayerId,
              ) ?? gameState.investigationResult.targetPlayerId
            }
            isWerewolfTeam={gameState.investigationResult.isWerewolfTeam}
          />
        )}
      </div>
    </div>
  );
}
