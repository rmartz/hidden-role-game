"use client";

import { useMemo } from "react";
import {
  WerewolfAction,
  getTargetablePlayers,
  isTeamPhaseKey,
} from "@/lib/game-modes/werewolf";
import type { WerewolfNighttimePhase } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { GameTimer } from "@/components/game";
import { Button } from "@/components/ui/button";
import { ConfirmTargetButton } from "./ConfirmTargetButton";

interface Props {
  gameId: string;
  gameState: PlayerGameState;
  phase: WerewolfNighttimePhase;
  turn: number;
  deadPlayerIds: string[];
}

/**
 * Check if the current phase is this player's turn.
 * For solo roles: myRole.id matches the active phase key.
 * For team phases: myRole.team matches the team in the phase key.
 */
function isPlayersTurn(
  myRole: { id: string; team: string } | null,
  activePhaseKey: string | undefined,
): boolean {
  if (!myRole || !activePhaseKey) return false;
  if (isTeamPhaseKey(activePhaseKey)) {
    const teamName = activePhaseKey.slice("team:".length);
    return myRole.team === teamName;
  }
  return myRole.id === activePhaseKey;
}

export function PlayerGameNightScreen({
  gameId,
  gameState,
  phase,
  turn,
  deadPlayerIds,
}: Props) {
  const action = useGameAction(gameId);
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

  if (!isMyTurn) return <div />;

  const isFirstTurn = turn === 1;
  const isTeamPhase = activePhaseKey ? isTeamPhaseKey(activePhaseKey) : false;
  const hasVisibleTeammates = gameState.visibleRoleAssignments.length > 0;
  const teammateLabel =
    gameState.visibleRoleAssignments.length === 1 ? "teammate" : "teammates";

  const isConfirmed = gameState.myNightTargetConfirmed ?? false;
  const resolvedTeamVotes = (gameState.teamVotes ?? []).map((vote) => ({
    playerName: vote.playerName,
    targetName:
      gameState.players.find((p) => p.id === vote.targetPlayerId)?.name ??
      "Unknown",
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

  // The phase key to pass for confirm label (team key or role ID).
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
        <strong className="text-foreground">{gameState.myRole?.name}</strong> —{" "}
        {isFirstTurn
          ? hasVisibleTeammates
            ? `awake, find your ${teammateLabel} and make yourself known to the Narrator.`
            : "awake and make yourself known to the Narrator."
          : "wake up and take your action."}
      </p>
      {!isFirstTurn && (
        <div>
          {isTeamPhase && !isConfirmed && hasVisibleTeammates && (
            <div className="mb-3 rounded-md border p-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Teammate votes:
              </p>
              {resolvedTeamVotes.length > 0 ? (
                <ul className="text-xs space-y-0.5">
                  {resolvedTeamVotes.map((vote, i) => (
                    <li key={i}>
                      {vote.playerName} → {vote.targetName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No votes yet.</p>
              )}
            </div>
          )}

          <h2 className="text-lg font-semibold mb-2">
            {isConfirmed ? "Your target" : "Choose a target"}
          </h2>
          <div className="flex flex-col gap-2">
            {targets.map(([player, isSelected]) => (
              <Button
                key={player.id}
                variant={isSelected ? "default" : "outline"}
                onClick={() => {
                  action.mutate({
                    actionId: WerewolfAction.SetNightTarget,
                    payload: {
                      targetPlayerId: isSelected ? undefined : player.id,
                    },
                  });
                }}
                disabled={action.isPending || isConfirmed}
                className="justify-start"
              >
                {player.name}
                {isSelected && " (selected)"}
              </Button>
            ))}
          </div>

          {isTeamPhase &&
            suggestedTargetId &&
            gameState.myNightTarget !== suggestedTargetId &&
            !isConfirmed && (
              <Button
                variant="secondary"
                className="mt-2"
                onClick={() => {
                  action.mutate({
                    actionId: WerewolfAction.SetNightTarget,
                    payload: { targetPlayerId: suggestedTargetId },
                  });
                }}
                disabled={action.isPending}
              >
                Approve suggested target
              </Button>
            )}

          <ConfirmTargetButton
            gameId={gameId}
            roleId={confirmPhaseKey}
            hasTarget={!!gameState.myNightTarget}
            isConfirmed={isConfirmed}
            isTeamPhase={isTeamPhase}
            allAgreed={allAgreed}
          />
        </div>
      )}
    </div>
  );
}

function noop() {
  // no-op: player night screen has no timer action
}
