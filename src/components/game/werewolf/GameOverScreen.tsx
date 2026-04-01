"use client";

import type { PlayerGameState } from "@/server/types";
import { useReturnToLobby } from "@/hooks";
import { GameOverScreenView } from "./GameOverScreenView";

interface GameOverScreenProps {
  gameState: PlayerGameState;
}

export function GameOverScreen({ gameState }: GameOverScreenProps) {
  const returnToLobbyMutation = useReturnToLobby(gameState.lobbyId);

  return (
    <GameOverScreenView
      gameState={gameState}
      onReturnToLobby={() => {
        returnToLobbyMutation.mutate();
      }}
      isReturning={returnToLobbyMutation.isPending}
      returnError={returnToLobbyMutation.isError}
    />
  );
}
