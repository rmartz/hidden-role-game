"use client";

import { GameStatus } from "@/lib/types";
import { WerewolfPhase } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useAdvanceGame } from "@/hooks";
import { OwnerStartingScreen } from "./OwnerStartingScreen";
import { OwnerGameNightScreen } from "./OwnerGameNightScreen";
import { OwnerGameDayScreen } from "./OwnerGameDayScreen";
import { OwnerGameScreen } from "./OwnerGameScreen";

interface Props {
  gameId: string;
  gameState: PlayerGameState;
}

export function WerewolfOwnerScreen({ gameId, gameState }: Props) {
  const advanceMutation = useAdvanceGame(gameId);
  const timerConfig = gameState.timerConfig;

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

  if (gameState.status.type === GameStatus.Playing) {
    const turnState = gameState.status.turnState as
      | WerewolfTurnState
      | undefined;

    if (turnState?.phase.type === WerewolfPhase.Nighttime) {
      return (
        <OwnerGameNightScreen
          gameId={gameId}
          gameState={gameState}
          turnState={turnState}
          nightPhaseSeconds={timerConfig?.nightPhaseSeconds ?? null}
        />
      );
    }

    if (turnState?.phase.type === WerewolfPhase.Daytime) {
      return (
        <OwnerGameDayScreen
          gameId={gameId}
          gameState={gameState}
          turnState={turnState}
          dayPhaseSeconds={timerConfig?.dayPhaseSeconds ?? null}
        />
      );
    }

    return <OwnerGameScreen gameState={gameState} />;
  }

  return null;
}
