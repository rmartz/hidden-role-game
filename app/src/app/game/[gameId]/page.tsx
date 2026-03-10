"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameStatus } from "@/lib/models";
import { useGameStateQuery } from "@/hooks";
import PlayerStartingScreen from "./PlayerStartingScreen";
import PlayerGameScreen from "./PlayerGameScreen";

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

  const gameStatus = gameState?.status.type;
  const isGameOwner =
    gameState !== undefined ? !!gameState.gameOwner : undefined;

  // Stop polling once the game leaves the Starting status.
  useEffect(() => {
    if (gameStatus && gameStatus !== GameStatus.Starting) {
      setRefetchInterval(undefined);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (error?.message === "401" || error?.message === "403") {
      router.push("/");
    }
  }, [error, router]);

  // Game owners have a dedicated view with all player roles.
  useEffect(() => {
    if (isGameOwner) {
      router.replace(`/game/${gameId}/owner`);
    }
  }, [isGameOwner, gameId, router]);

  if (gameState && !isGameOwner) {
    if (gameState.status.type === GameStatus.Starting) {
      return <PlayerStartingScreen gameState={gameState} />;
    }

    if (gameState.status.type === GameStatus.Playing) {
      return <PlayerGameScreen gameId={gameId} gameState={gameState} />;
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
