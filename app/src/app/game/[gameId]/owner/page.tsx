"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getGameState } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";

export default function GameOwnerPage() {
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
        throw new Error(String(httpStatus));
      if (data.status === ServerResponseStatus.Error)
        throw new Error(data.error);
      return data.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (error?.message === "401" || error?.message === "403") {
      router.push("/");
    }
  }, [error, router]);

  // Regular players don't belong on this route.
  useEffect(() => {
    if (gameState && !gameState.isGameOwner) {
      router.replace(`/game/${gameId}`);
    }
  }, [gameState, gameId, router]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>

      {isLoading && <p>Loading...</p>}

      {error && error.message !== "401" && error.message !== "403" && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {error.message}
        </div>
      )}

      {gameState?.isGameOwner && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <h2>Game Owner View</h2>
            <p>You can see all player roles.</p>
          </div>

          {gameState.allRoleAssignments &&
            gameState.allRoleAssignments.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h2>Player Roles</h2>
                <ul>
                  {gameState.allRoleAssignments.map((t) => (
                    <li key={t.player.id}>
                      {t.player.name} — {t.role.name} ({t.role.team})
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
