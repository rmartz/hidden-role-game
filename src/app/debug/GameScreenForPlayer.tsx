"use client";

import { useEffect, useState } from "react";
import { GameStatus } from "@/lib/types";
import type { GameMode } from "@/lib/types";
import { useGameStateQuery, GameModeContext } from "@/hooks";
import { WerewolfGameScreen } from "@/components/game";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";

const POLL_INTERVAL_MS = 2000;

export function GameScreenForPlayer({
  gameId,
  gameMode,
}: {
  gameId: string;
  gameMode: GameMode;
}) {
  const [refetchInterval, setRefetchInterval] = useState<number | undefined>(
    POLL_INTERVAL_MS,
  );

  const {
    data: gameState,
    isLoading,
    error,
  } = useGameStateQuery(gameId, gameMode, refetchInterval);

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

  return (
    <GameModeContext.Provider value={gameMode}>
      <WerewolfGameScreen
        gameId={gameId}
        gameState={gameState as WerewolfPlayerGameState}
      />
    </GameModeContext.Provider>
  );
}
