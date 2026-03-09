"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStateQuery } from "@/hooks";
import { GAME_MODES } from "@/lib/game-modes";

export default function GameOwnerPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();

  const { data: gameState, isLoading, error } = useGameStateQuery(gameId);

  useEffect(() => {
    if (error?.message === "401" || error?.message === "403") {
      router.push("/");
    }
  }, [error, router]);

  // Regular players don't belong on this route.
  useEffect(() => {
    if (gameState && !gameState.gameOwner) {
      router.replace(`/game/${gameId}`);
    }
  }, [gameState, gameId, router]);

  const teamLabels = gameState
    ? GAME_MODES[gameState.gameMode].teamLabels
    : undefined;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>

      {isLoading && <p>Loading...</p>}

      {error && error.message !== "401" && error.message !== "403" && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {error.message}
        </div>
      )}

      {gameState?.gameOwner && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <h2>Game Owner View</h2>
            <p>You can see all player roles.</p>
          </div>

          {gameState.visibleRoleAssignments.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h2>Player Roles</h2>
              <ul>
                {gameState.visibleRoleAssignments.map((t) => (
                  <li key={t.player.id}>
                    {t.player.name} — {t.role.name} (
                    {teamLabels?.[t.role.team] ?? t.role.team})
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
        </>
      )}
    </div>
  );
}
