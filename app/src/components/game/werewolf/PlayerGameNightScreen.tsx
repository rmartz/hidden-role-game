"use client";

import { useMemo } from "react";
import {
  getTargetablePlayers,
  isGroupPhaseKey,
  isPlayersTurn,
} from "@/lib/game-modes/werewolf";
import type { WerewolfNighttimePhase } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { getPlayerName } from "@/lib/player-utils";
import { GameTimer } from "@/components/game";
import { PlayerFirstTurnScreen } from "./PlayerFirstTurnScreen";
import { PlayerInvestigationResult } from "./PlayerInvestigationResult";
import { PlayerTargetSelection } from "./PlayerTargetSelection";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface PlayerGameNightScreenProps {
  gameId: string;
  gameState: PlayerGameState;
  phase: WerewolfNighttimePhase;
  turn: number;
  deadPlayerIds: string[];
}

export function PlayerGameNightScreen({
  gameId,
  gameState,
  phase,
  turn,
  deadPlayerIds,
}: PlayerGameNightScreenProps) {
  const phaseStartedAt = useMemo(
    () => new Date(phase.startedAt),
    [phase.startedAt],
  );

  const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
  const isMyTurn = isPlayersTurn(gameState.myRole, activePhaseKey);
  const isFirstTurn = turn === 1;
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

  const content = gameState.amDead ? (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-2 text-muted-foreground">
        {WEREWOLF_COPY.night.youAreEliminated}
      </h1>
      <p className="text-muted-foreground">
        {WEREWOLF_COPY.night.eliminatedSubtext}
      </p>
    </div>
  ) : !isMyTurn ? (
    <div className="p-5">
      <p className="text-muted-foreground italic">
        {WEREWOLF_COPY.night.stopPeeking}
      </p>
    </div>
  ) : isFirstTurn ? (
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
          durationSeconds={gameState.timerConfig?.nightPhaseSeconds}
          startedAt={phaseStartedAt}
          resetKey={phase.currentPhaseIndex}
        />
        <p className="text-muted-foreground mb-4">
          {WEREWOLF_COPY.night.wakeUp}
        </p>
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

  return content;
}
