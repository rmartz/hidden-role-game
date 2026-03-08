"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getGameState } from "@/lib/api";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();

  const {
    data: gameState,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["game", gameId],
    queryFn: async () => {
      const { data, httpStatus } = await getGameState(gameId);
      if (httpStatus === 401 || httpStatus === 403)
        throw new Error(`${httpStatus}`);
      if (data.status === "error") throw new Error(data.error);
      return data.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (error?.message === "401" || error?.message === "403") {
      router.push("/");
    }
  }, [error, router]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>

      {isLoading && <p>Loading...</p>}

      {error && error.message !== "401" && error.message !== "403" && (
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
