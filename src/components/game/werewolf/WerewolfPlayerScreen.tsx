"use client";

import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { GameStatus } from "@/lib/types";

import { GameOverScreen } from "./GameOverScreen";
import { PlayerGameScreen } from "./PlayerGameScreen";
import { PlayerStartingScreen } from "./PlayerStartingScreen";

interface WerewolfPlayerScreenProps {
  gameId: string;
  gameState: WerewolfPlayerGameState;
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
