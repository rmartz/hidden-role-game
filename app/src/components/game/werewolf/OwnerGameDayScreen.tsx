"use client";

import { useCallback, useState } from "react";
import { WerewolfPhase, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { usePhaseTimer } from "@/hooks/usePhaseTimer";
import { GameRolesList, PhaseTimer, PlayersRoleList } from "@/components/game";
import { Button } from "@/components/ui/button";

interface Props {
  gameId: string;
  gameState: PlayerGameState;
  turnState: WerewolfTurnState;
  dayPhaseSeconds: number | null;
}

export function OwnerGameDayScreen({
  gameId,
  gameState,
  turnState,
  dayPhaseSeconds,
}: Props) {
  const action = useGameAction(gameId);
  const [isPaused, setIsPaused] = useState(false);

  const handleAutoAdvance = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.StartNight });
  }, [action]);

  const { secondsRemaining, elapsedSeconds } = usePhaseTimer({
    durationSeconds: dayPhaseSeconds,
    isPaused,
    onExpire: handleAutoAdvance,
    resetKey: turnState.turn,
  });

  const { phase } = turnState;
  if (phase.type !== WerewolfPhase.Daytime) return null;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Day — Turn {turnState.turn}</h1>
      <PhaseTimer
        secondsRemaining={secondsRemaining}
        elapsedSeconds={elapsedSeconds}
        isPaused={isPaused}
        onTogglePause={() => {
          setIsPaused((p) => !p);
        }}
      />
      <Button
        onClick={() => {
          action.mutate({ actionId: WerewolfAction.StartNight });
        }}
        disabled={action.isPending}
        className="mb-5"
      >
        Start Next Night
      </Button>
      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        deadPlayerIds={gameState.deadPlayerIds}
        renderActions={(playerId, isDead) =>
          playerId !== gameState.gameOwner?.id &&
          (isDead ? (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                action.mutate({
                  actionId: WerewolfAction.MarkPlayerAlive,
                  payload: { playerId },
                });
              }}
              disabled={action.isPending}
            >
              Revive
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="xs"
              onClick={() => {
                if (window.confirm("Mark this player as dead?")) {
                  action.mutate({
                    actionId: WerewolfAction.MarkPlayerDead,
                    payload: { playerId },
                  });
                }
              }}
              disabled={action.isPending}
            >
              Kill
            </Button>
          ))
        }
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
