"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getGameState } from "@/lib/api";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();

  const {
    data: gameState,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["game", gameId],
    queryFn: async () => {
      const response = await getGameState(gameId);
      if (response.status === "error") throw new Error(response.error);
      return response.data;
    },
  });

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>

      {isLoading && <p>Loading...</p>}

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {error.message}
        </div>
      )}

      {gameState && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <h2>Your Role</h2>
            <p>
              <strong>{gameState.myRole.name}</strong> — Team:{" "}
              {gameState.myRole.team}
            </p>
          </div>

          {gameState.visibleTeammates.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h2>Your Teammates</h2>
              <ul>
                {gameState.visibleTeammates.map((t) => (
                  <li key={t.player.id}>
                    {t.player.name} — {t.role.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2>All Players</h2>
            <ul>
              {gameState.players.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
