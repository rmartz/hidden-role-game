"use client";

import { GameStatus } from "@/lib/models";
import type { PlayerGameState } from "@/server/models";
import { useGameStateQuery } from "@/hooks";
import PlayerGameNightScreen from "./PlayerGameNightScreen";
import PlayerGameDayScreen from "./PlayerGameDayScreen";

const POLL_INTERVAL_MS = 2000;

interface Props {
  gameId: string;
  gameState: PlayerGameState;
}

export default function PlayerGameScreen({ gameId, gameState }: Props) {
  const { status } = gameState;

  const isNighttime =
    status.type === GameStatus.Playing &&
    status.turnState?.phase.type === "nighttime";

  // Poll throughout nighttime to detect when this player's turn starts or ends.
  useGameStateQuery(gameId, isNighttime ? POLL_INTERVAL_MS : undefined);

  if (status.type !== GameStatus.Playing) return null;

  const { turnState } = status;

  if (turnState?.phase.type === "nighttime") {
    return (
      <PlayerGameNightScreen gameState={gameState} phase={turnState.phase} />
    );
  }

  return <PlayerGameDayScreen gameState={gameState} />;
}
