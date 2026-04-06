"use client";

import { GameMode } from "@/lib/types";
import { useGameStateQuery, GameModeContext } from "@/hooks";
import { WerewolfGameScreen } from "@/components/game";
import { SecretVillainGameScreen } from "@/components/game/secret-villain";

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
      {gameState.gameMode === GameMode.Werewolf ? (
        <WerewolfGameScreen gameId={gameId} gameState={gameState} />
      ) : gameState.gameMode === GameMode.SecretVillain ? (
        <SecretVillainGameScreen gameId={gameId} gameState={gameState} />
      ) : (
        <p className="p-5 text-muted-foreground">
          Unsupported game mode: {gameMode}
        </p>
      )}
    </GameModeContext.Provider>
  );
}
