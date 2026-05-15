"use client";

import { useAdvanceGame } from "@/hooks";
import type { WerewolfTurnState } from "@/lib/game/modes/werewolf";
import { WerewolfPhase } from "@/lib/game/modes/werewolf";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { GameStatus } from "@/lib/types";

import { GameOverScreen } from "./GameOverScreen";
import { OwnerGameDayScreen } from "./OwnerGameDayScreen";
import { OwnerGameNightScreen } from "./OwnerGameNightScreen";
import { OwnerGameScreen } from "./OwnerGameScreen";
import { OwnerStartingScreen } from "./OwnerStartingScreen";

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
        gameId={gameId}
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
