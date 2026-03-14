"use client";

import { useMemo } from "react";
import { GameStatus } from "@/lib/types";
import type { TimerConfig } from "@/lib/types";
import { WerewolfPhase } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useAdvanceGame } from "@/hooks";
import { OwnerStartingScreen } from "./OwnerStartingScreen";
import { OwnerGameNightScreen } from "./OwnerGameNightScreen";
import { OwnerGameDayScreen } from "./OwnerGameDayScreen";
import { OwnerGameScreen } from "./OwnerGameScreen";

const DEFAULT_TIMER_CONFIG: TimerConfig = {
  startCountdownSeconds: 10,
  nightPhaseSeconds: null,
  dayPhaseSeconds: null,
};

interface Props {
  gameId: string;
  gameState: PlayerGameState;
}

export function WerewolfOwnerScreen({ gameId, gameState }: Props) {
  const advanceMutation = useAdvanceGame(gameId);
  const timerConfig = useMemo(
    () => gameState.timerConfig ?? DEFAULT_TIMER_CONFIG,
    [gameState.timerConfig],
  );

  if (gameState.status.type === GameStatus.Starting) {
    return (
      <OwnerStartingScreen
        gameState={gameState}
        durationSeconds={timerConfig.startCountdownSeconds}
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
          nightPhaseSeconds={timerConfig.nightPhaseSeconds}
        />
      );
    }

    if (turnState?.phase.type === WerewolfPhase.Daytime) {
      return (
        <OwnerGameDayScreen
          gameId={gameId}
          gameState={gameState}
          turnState={turnState}
          dayPhaseSeconds={timerConfig.dayPhaseSeconds}
        />
      );
    }

    return <OwnerGameScreen gameState={gameState} />;
  }

  return null;
}
