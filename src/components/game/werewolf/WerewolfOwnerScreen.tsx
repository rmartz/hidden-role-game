"use client";

import { GameStatus } from "@/lib/types";
import { WerewolfPhase } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";
import { useAdvanceGame } from "@/hooks";
import { OwnerStartingScreen } from "./OwnerStartingScreen";
import { OwnerGameNightScreen } from "./OwnerGameNightScreen";
import { OwnerGameDayScreen } from "./OwnerGameDayScreen";
import { OwnerGameScreen } from "./OwnerGameScreen";
import { GameOverScreen } from "./GameOverScreen";

interface WerewolfOwnerScreenProps {
  gameId: string;
  gameState: WerewolfPlayerGameState;
}

export function WerewolfOwnerScreen({
  gameId,
  gameState,
}: WerewolfOwnerScreenProps) {
  const advanceMutation = useAdvanceGame(gameId);

  if (gameState.status.type === GameStatus.Finished) {
    return <GameOverScreen gameState={gameState} />;
  }

  if (gameState.status.type === GameStatus.Starting) {
    return (
      <OwnerStartingScreen
        gameState={gameState}
        onStart={() => {
          advanceMutation.mutate();
        }}
      />
    );
  }

  const turnState = gameState.status.turnState as WerewolfTurnState | undefined;

  if (turnState?.phase.type === WerewolfPhase.Nighttime) {
    return (
      <OwnerGameNightScreen
        gameId={gameId}
        gameState={gameState}
        turnState={turnState}
      />
    );
  }

  if (turnState?.phase.type === WerewolfPhase.Daytime) {
    return (
      <OwnerGameDayScreen
        gameId={gameId}
        gameState={gameState}
        turnState={turnState}
      />
    );
  }

  return <OwnerGameScreen gameState={gameState} />;
}
