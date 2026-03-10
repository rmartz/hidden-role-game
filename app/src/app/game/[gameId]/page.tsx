"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameStatus } from "@/lib/models";
import { useGameStateQuery } from "@/hooks";
import { WerewolfGameScreen } from "@/components/game";

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

  if (gameState) {
    return <WerewolfGameScreen gameId={gameId} gameState={gameState} />;
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Hidden Role Game</h1>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {error && error.message !== "401" && error.message !== "403" && (
        <p className="text-destructive text-sm">Error: {error.message}</p>
      )}
    </div>
  );
}
