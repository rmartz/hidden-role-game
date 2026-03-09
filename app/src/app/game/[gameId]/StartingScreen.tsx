"use client";

import { useEffect, useState } from "react";
import type { PlayerGameState } from "@/server/models";

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

      <div style={{ marginBottom: "20px" }}>
        <h2>Your Role</h2>
        <p>
          <strong>{gameState.myRole?.name}</strong> — Team:{" "}
          {gameState.myRole?.team}
        </p>
      </div>

      {gameState.visibleRoleAssignments.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h2>Your Teammates</h2>
          <ul>
            {gameState.visibleRoleAssignments.map((t) => (
              <li key={t.player.id}>
                {t.player.name} — {t.role.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {gameState.rolesInPlay && gameState.rolesInPlay.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h2>Roles In Play</h2>
          <ul>
            {gameState.rolesInPlay.map((r) => (
              <li key={r.id}>
                {r.name} — {r.team}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
