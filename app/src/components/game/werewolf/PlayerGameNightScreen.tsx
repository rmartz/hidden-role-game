"use client";

import { useMemo } from "react";
import {
  WerewolfAction,
  getTargetablePlayers,
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

  const isMyTurn =
    gameState.myRole?.id === phase.nightPhaseOrder[phase.currentPhaseIndex];

  if (!isMyTurn) return <div />;

  const isFirstTurn = turn === 1;
  const hasVisibleTeammates = gameState.visibleRoleAssignments.length > 0;
  const teammateLabel =
    gameState.visibleRoleAssignments.length === 1 ? "teammate" : "teammates";

  const isConfirmed = gameState.myNightTargetConfirmed ?? false;

  const allTargets = getTargetablePlayers(
    gameState.players,
    gameState.gameOwner?.id,
    deadPlayerIds,
  ).map((player) => [player, gameState.myNightTarget === player.id] as const);

  const targets = isConfirmed
    ? allTargets.filter(([, isSelected]) => isSelected)
    : allTargets;

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
          <ConfirmTargetButton
            gameId={gameId}
            roleId={gameState.myRole?.id}
            hasTarget={!!gameState.myNightTarget}
            isConfirmed={isConfirmed}
          />
        </div>
      )}
    </div>
  );
}

function noop() {
  // no-op: player night screen has no timer action
}
