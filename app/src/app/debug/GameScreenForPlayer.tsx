"use client";

import { useEffect, useState } from "react";
import { GameStatus } from "@/lib/models";
import { useGameStateQuery } from "@/hooks";
import { WerewolfGameScreen } from "@/components/game";

const POLL_INTERVAL_MS = 2000;

export function GameScreenForPlayer({ gameId }: { gameId: string }) {
  const [refetchInterval, setRefetchInterval] = useState<number | undefined>(
    POLL_INTERVAL_MS,
  );

  const {
    data: gameState,
    isLoading,
    error,
  } = useGameStateQuery(gameId, refetchInterval);

  const gameStatus = gameState?.status.type;

  useEffect(() => {
    if (gameStatus !== undefined && gameStatus !== GameStatus.Starting) {
      setRefetchInterval(undefined);
    }
  }, [gameStatus]);

  if (!gameState) {
    return (
      <div className="p-5">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {error && (
          <p className="text-destructive text-sm">Error: {error.message}</p>
        )}
      </div>
    );
  }

  return <WerewolfGameScreen gameId={gameId} gameState={gameState} />;
}
