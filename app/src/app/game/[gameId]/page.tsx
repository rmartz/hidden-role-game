"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameStatus } from "@/lib/models";
import { useGameStateQuery } from "@/hooks";
import StartingScreen from "./StartingScreen";

const POLL_INTERVAL_MS = 2000;

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();

  const [refetchInterval, setRefetchInterval] = useState<number | undefined>(
    POLL_INTERVAL_MS,
  );

  const {
    data: gameState,
    isLoading,
    error,
  } = useGameStateQuery(gameId, refetchInterval);

  // Stop polling once the game leaves the Starting status.
  useEffect(() => {
    if (gameState?.status.type !== GameStatus.Starting) {
      setRefetchInterval(undefined);
    }
  }, [gameState?.status.type]);

  useEffect(() => {
    if (error?.message === "401" || error?.message === "403") {
      router.push("/");
    }
  }, [error, router]);

  // Game owners have a dedicated view with all player roles.
  useEffect(() => {
    if (gameState?.gameOwner) {
      router.replace(`/game/${gameId}/owner`);
    }
  }, [gameState?.gameOwner, gameId, router]);

  if (gameState && !gameState.gameOwner) {
    if (gameState.status.type === GameStatus.Starting) {
      return <StartingScreen gameState={gameState} />;
    }

    if (gameState.status.type === GameStatus.Playing) {
      return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
          <h1>Hidden Role Game</h1>
          <p>The game is underway.</p>
        </div>
      );
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>

      {isLoading && <p>Loading…</p>}

      {error && error.message !== "401" && error.message !== "403" && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {error.message}
        </div>
      )}
    </div>
  );
}
