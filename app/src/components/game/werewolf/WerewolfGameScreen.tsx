"use client";

import type { PlayerGameState } from "@/server/types";
import { WerewolfOwnerScreen } from "./WerewolfOwnerScreen";
import { WerewolfPlayerScreen } from "./WerewolfPlayerScreen";

interface Props {
  gameId: string;
  gameState: PlayerGameState;
}

export function WerewolfGameScreen({ gameId, gameState }: Props) {
  if (gameState.myRole === null) {
    return <WerewolfOwnerScreen gameId={gameId} gameState={gameState} />;
  }
  return <WerewolfPlayerScreen gameId={gameId} gameState={gameState} />;
}
