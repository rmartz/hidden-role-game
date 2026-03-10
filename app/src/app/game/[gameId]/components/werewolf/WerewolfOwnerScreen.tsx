"use client";

import { GameStatus } from "@/lib/models";
import type { PlayerGameState } from "@/server/models";
import { useAdvanceGame, useAdvancePhase } from "@/hooks";
import { OwnerStartingScreen } from "./OwnerStartingScreen";
import { OwnerGameNightScreen } from "./OwnerGameNightScreen";
import { OwnerGameDayScreen } from "./OwnerGameDayScreen";
import { OwnerGameScreen } from "./OwnerGameScreen";

const STARTING_DURATION_SECONDS = 10;

interface Props {
  gameId: string;
  gameState: PlayerGameState;
}

export function WerewolfOwnerScreen({ gameId, gameState }: Props) {
  const advanceMutation = useAdvanceGame(gameId);
  const advancePhaseMutation = useAdvancePhase(gameId);

  if (gameState.status.type === GameStatus.Starting) {
    return (
      <OwnerStartingScreen
        gameState={gameState}
        durationSeconds={STARTING_DURATION_SECONDS}
        onStart={() => {
          advanceMutation.mutate();
        }}
      />
    );
  }

  if (gameState.status.type === GameStatus.Playing) {
    const { turnState } = gameState.status;

    if (turnState?.phase.type === "nighttime") {
      return (
        <OwnerGameNightScreen
          gameState={gameState}
          turnState={turnState}
          onAdvancePhase={() => {
            advancePhaseMutation.mutate();
          }}
          isAdvancePending={advancePhaseMutation.isPending}
        />
      );
    }

    if (turnState?.phase.type === "daytime") {
      return (
        <OwnerGameDayScreen
          gameState={gameState}
          turnState={turnState}
          onAdvancePhase={() => {
            advancePhaseMutation.mutate();
          }}
          isAdvancePending={advancePhaseMutation.isPending}
        />
      );
    }

    return <OwnerGameScreen gameState={gameState} />;
  }

  return null;
}
