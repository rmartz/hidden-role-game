"use client";

import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { useReturnToLobby } from "@/hooks";
import { GameOverScreenView } from "./GameOverScreenView";

interface GameOverScreenProps {
  gameState: WerewolfPlayerGameState;
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
