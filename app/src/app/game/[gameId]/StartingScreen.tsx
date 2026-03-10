"use client";

import { useEffect, useState } from "react";
import type { PlayerGameState } from "@/server/models";
import PlayerRole from "./PlayerRole";
import PlayersRoleList from "./PlayersRoleList";
import GameRolesList from "./GameRolesList";

const STARTING_DURATION_SECONDS = 10;

interface Props {
  gameState: PlayerGameState;
}

export default function StartingScreen({ gameState }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(STARTING_DURATION_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [secondsLeft]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Game Starting</h1>
      <p>
        The game is starting in <strong>{secondsLeft}</strong> second
        {secondsLeft !== 1 ? "s" : ""}…
      </p>

      {gameState.myRole && (
        <div style={{ marginBottom: "20px" }}>
          <h2>Your Role</h2>
          <PlayerRole role={gameState.myRole} />
        </div>
      )}

      <PlayersRoleList assignments={gameState.visibleRoleAssignments} />

      <GameRolesList roles={gameState.rolesInPlay ?? []} />
    </div>
  );
}
