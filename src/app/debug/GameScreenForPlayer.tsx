"use client";

import type { GameMode } from "@/lib/types";
import { useGameStateQuery, GameModeContext } from "@/hooks";
import { WerewolfGameScreen } from "@/components/game";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";

export interface GameScreenForPlayerProps {
  gameId: string;
  gameMode: GameMode;
}

export function GameScreenForPlayer({
  gameId,
  gameMode,
}: GameScreenForPlayerProps) {
  const {
    data: gameState,
    isLoading,
    error,
  } = useGameStateQuery(gameId, gameMode);

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
