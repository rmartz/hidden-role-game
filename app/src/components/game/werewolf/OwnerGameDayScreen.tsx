"use client";

import { useEffect, useRef, useState } from "react";
import { WerewolfPhase, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { GameRolesList, PlayersRoleList } from "@/components/game";
import { Button } from "@/components/ui/button";

interface Props {
  gameId: string;
  gameState: PlayerGameState;
  turnState: WerewolfTurnState;
}

export function OwnerGameDayScreen({ gameId, gameState, turnState }: Props) {
  const action = useGameAction(gameId);

  const { phase } = turnState;
  const startedAt =
    phase.type === WerewolfPhase.Daytime ? phase.startedAt : null;

  const [elapsedSeconds, setElapsedSeconds] = useState(
    startedAt !== null ? Math.floor((Date.now() - startedAt) / 1000) : 0,
  );
  const startedAtRef = useRef(startedAt);

  useEffect(() => {
    startedAtRef.current = startedAt;
    if (startedAt === null) return;
    setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));

    const interval = setInterval(() => {
      if (startedAtRef.current !== null) {
        setElapsedSeconds(
          Math.floor((Date.now() - startedAtRef.current) / 1000),
        );
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [startedAt]);

  if (phase.type !== WerewolfPhase.Daytime) return null;

  const minutes = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const elapsed = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Day — Turn {turnState.turn}</h1>
      <p className="mb-4 text-muted-foreground">
        Day in progress: <strong className="text-foreground">{elapsed}</strong>
      </p>
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
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
