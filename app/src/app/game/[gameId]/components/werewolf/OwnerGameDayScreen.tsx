"use client";

import { useEffect, useRef, useState } from "react";
import { WerewolfPhase, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/models";
import { useGameAction } from "@/hooks";
import { GameRolesList, PlayersRoleList } from "..";

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
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Day — Turn {turnState.turn}</h1>
      <p>
        Day in progress: <strong>{elapsed}</strong>
      </p>
      <button
        onClick={() => { action.mutate({ actionId: WerewolfAction.StartNight }); }}
        disabled={action.isPending}
      >
        Start Next Night
      </button>
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
