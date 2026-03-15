"use client";

import { useMemo } from "react";
import {
  getTargetablePlayers,
  isTeamPhaseKey,
  isPlayersTurn,
} from "@/lib/game-modes/werewolf";
import type { WerewolfNighttimePhase } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { getPlayerName } from "@/lib/player-utils";
import { GameTimer } from "@/components/game";
import { PlayerFirstTurnScreen } from "./PlayerFirstTurnScreen";
import { PlayerTargetSelection } from "./PlayerTargetSelection";

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
  const nightPhaseSeconds = gameState.timerConfig?.nightPhaseSeconds ?? null;

  const phaseStartedAt = useMemo(
    () => new Date(phase.startedAt),
    [phase.startedAt],
  );

  if (gameState.amDead) {
    return (
      <div className="p-5">
        <h1 className="text-2xl font-bold mb-2 text-muted-foreground">
          You Have Been Eliminated
        </h1>
        <p className="text-muted-foreground">
          You are no longer in the game. Stay quiet while the night continues.
        </p>
      </div>
    );
  }

  const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
  const isMyTurn = isPlayersTurn(gameState.myRole, activePhaseKey);

  if (!isMyTurn) {
    return (
      <div className="p-5">
        <p className="text-muted-foreground italic">
          Stop peeking, you dirty cheater.
        </p>
      </div>
    );
  }

  const isFirstTurn = turn === 1;
  const isTeamPhase = activePhaseKey ? isTeamPhaseKey(activePhaseKey) : false;
  const teammateNames = gameState.visibleRoleAssignments.map(
    (a) => a.player.name,
  );

  if (isFirstTurn) {
    return (
      <PlayerFirstTurnScreen
        roleName={gameState.myRole?.name}
        teammateNames={teammateNames}
      />
    );
  }

  const isConfirmed = gameState.myNightTargetConfirmed ?? false;
  const hasVisibleTeammates =
    isTeamPhase && gameState.visibleRoleAssignments.length > 1;
  const resolvedTeamVotes = (gameState.teamVotes ?? []).map((vote) => ({
    playerName: vote.playerName,
    targetName:
      getPlayerName(gameState.players, vote.targetPlayerId) ?? "Unknown",
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

  const confirmPhaseKey = isTeamPhase ? activePhaseKey : gameState.myRole?.id;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-2">It&apos;s Your Turn</h1>
      {nightPhaseSeconds !== null ? (
        <GameTimer
          durationSeconds={nightPhaseSeconds}
          startedAt={phaseStartedAt}
          onTimerTrigger={noop}
          resetKey={phase.currentPhaseIndex}
        />
      ) : (
        <GameTimer
          startedAt={phaseStartedAt}
          resetKey={phase.currentPhaseIndex}
        />
      )}
      <p className="text-muted-foreground mb-4">
        <strong className="text-foreground">{gameState.myRole?.name}</strong> —
        wake up and take your action.
      </p>
      <PlayerTargetSelection
        gameId={gameId}
        targets={targets}
        isConfirmed={isConfirmed}
        isTeamPhase={isTeamPhase}
        confirmPhaseKey={confirmPhaseKey}
        hasTarget={!!gameState.myNightTarget}
        allAgreed={allAgreed}
        hasVisibleTeammates={hasVisibleTeammates}
        teamVotes={resolvedTeamVotes}
        suggestedTargetId={suggestedTargetId}
        myNightTarget={gameState.myNightTarget}
      />
      {gameState.investigationResult && (
        <div className="mt-4 rounded-md border p-3 text-sm">
          <p className="font-medium">Investigation result:</p>
          <p className="mt-1">
            <strong className="text-foreground">
              {getPlayerName(
                gameState.players,
                gameState.investigationResult.targetPlayerId,
              ) ?? gameState.investigationResult.targetPlayerId}
            </strong>{" "}
            is{" "}
            <strong className="text-foreground">
              {gameState.investigationResult.isWerewolfTeam
                ? "on the Werewolf team"
                : "not on the Werewolf team"}
            </strong>
            .
          </p>
        </div>
      )}
    </div>
  );
}

function noop() {
  // no-op: player night screen has no timer action
}
