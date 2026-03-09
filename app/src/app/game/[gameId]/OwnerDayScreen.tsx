"use client";

import { useEffect, useRef, useState } from "react";
import type { TurnState } from "@/lib/models";
import type { PlayerGameState } from "@/server/models";
import PlayersRoleList from "./PlayersRoleList";
import GameRolesList from "./GameRolesList";

interface Props {
  gameState: PlayerGameState;
  turnState: TurnState;
  onAdvancePhase: () => void;
  isAdvancePending: boolean;
}

export default function OwnerDayScreen({
  gameState,
  turnState,
  onAdvancePhase,
  isAdvancePending,
}: Props) {
  const { phase } = turnState;
  if (phase.type !== "daytime") return null;

  const startedAt = phase.startedAt;
  const [elapsedSeconds, setElapsedSeconds] = useState(
    Math.floor((Date.now() - startedAt) / 1000),
  );
  const startedAtRef = useRef(startedAt);

  useEffect(() => {
    startedAtRef.current = startedAt;
    setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [startedAt]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const elapsed = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Day — Turn {turnState.turn}</h1>
      <p>
        Day in progress: <strong>{elapsed}</strong>
      </p>
      <button onClick={onAdvancePhase} disabled={isAdvancePending}>
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
