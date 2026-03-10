"use client";

import { GameStatus } from "@/lib/models";
import type { PlayerGameState } from "@/server/models";
import { useGameStateQuery } from "@/hooks";
import PlayerNightScreen from "./PlayerNightScreen";
import PlayerDayScreen from "./PlayerDayScreen";

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
    return <PlayerNightScreen gameState={gameState} phase={turnState.phase} />;
  }

  return <PlayerDayScreen gameState={gameState} />;
}
