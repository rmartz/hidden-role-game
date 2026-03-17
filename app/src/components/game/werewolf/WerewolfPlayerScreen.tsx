"use client";

import { GameStatus } from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import { PlayerStartingScreen } from "./PlayerStartingScreen";
import { PlayerGameScreen } from "./PlayerGameScreen";
import { GameOverScreen } from "./GameOverScreen";

interface WerewolfPlayerScreenProps {
  gameId: string;
  gameState: PlayerGameState;
}

export function WerewolfPlayerScreen({
  gameId,
  gameState,
}: WerewolfPlayerScreenProps) {
  if (gameState.status.type === GameStatus.Finished) {
    return <GameOverScreen gameState={gameState} />;
  }

  if (gameState.status.type === GameStatus.Starting) {
    return <PlayerStartingScreen gameState={gameState} />;
  }

  return <PlayerGameScreen gameId={gameId} gameState={gameState} />;
}
