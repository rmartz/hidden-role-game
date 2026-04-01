"use client";

import type { PlayerGameState } from "@/server/types";
import { WerewolfOwnerScreen } from "./WerewolfOwnerScreen";
import { WerewolfPlayerScreen } from "./WerewolfPlayerScreen";

interface WerewolfGameScreenProps {
  gameId: string;
  gameState: PlayerGameState;
}

export function WerewolfGameScreen({
  gameId,
  gameState,
}: WerewolfGameScreenProps) {
  if (gameState.myRole === undefined) {
    return <WerewolfOwnerScreen gameId={gameId} gameState={gameState} />;
  }
  return <WerewolfPlayerScreen gameId={gameId} gameState={gameState} />;
}
