"use client";

import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { WerewolfOwnerScreen } from "./WerewolfOwnerScreen";
import { WerewolfPlayerScreen } from "./WerewolfPlayerScreen";

interface WerewolfGameScreenProps {
  gameId: string;
  gameState: WerewolfPlayerGameState;
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
