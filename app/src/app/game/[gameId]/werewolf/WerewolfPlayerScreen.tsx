"use client";

import { GameStatus } from "@/lib/models";
import type { PlayerGameState } from "@/server/models";
import PlayerStartingScreen from "./PlayerStartingScreen";
import PlayerGameScreen from "./PlayerGameScreen";

interface Props {
  gameId: string;
  gameState: PlayerGameState;
}

export default function WerewolfPlayerScreen({ gameId, gameState }: Props) {
  if (gameState.status.type === GameStatus.Starting) {
    return <PlayerStartingScreen gameState={gameState} />;
  }

  if (gameState.status.type === GameStatus.Playing) {
    return <PlayerGameScreen gameId={gameId} gameState={gameState} />;
  }

  return null;
}
