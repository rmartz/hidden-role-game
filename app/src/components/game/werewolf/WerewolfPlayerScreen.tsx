"use client";

import { GameStatus } from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import { PlayerStartingScreen } from "./PlayerStartingScreen";
import { PlayerGameScreen } from "./PlayerGameScreen";

interface WerewolfPlayerScreenProps {
  gameId: string;
  gameState: PlayerGameState;
}

export function WerewolfPlayerScreen({
  gameId,
  gameState,
}: WerewolfPlayerScreenProps) {
  if (gameState.status.type === GameStatus.Starting) {
    return <PlayerStartingScreen gameState={gameState} />;
  }

  if (gameState.status.type === GameStatus.Playing) {
    return <PlayerGameScreen gameId={gameId} gameState={gameState} />;
  }

  return null;
}
