"use client";

import { GameStatus } from "@/lib/models";
import { WerewolfPhase } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/models";
import { useGameStateQuery } from "@/hooks";
import { PlayerGameNightScreen } from "./PlayerGameNightScreen";
import { PlayerGameDayScreen } from "./PlayerGameDayScreen";

const POLL_INTERVAL_MS = 2000;

interface Props {
  gameId: string;
  gameState: PlayerGameState;
}

export function PlayerGameScreen({ gameId, gameState }: Props) {
  const { status } = gameState;

  const turnState =
    status.type === GameStatus.Playing
      ? (status.turnState as WerewolfTurnState | undefined)
      : undefined;

  const isNighttime = turnState?.phase.type === WerewolfPhase.Nighttime;

  // Poll throughout nighttime to detect when this player's turn starts or ends.
  useGameStateQuery(gameId, isNighttime ? POLL_INTERVAL_MS : undefined);

  if (status.type !== GameStatus.Playing) return null;

  if (turnState?.phase.type === WerewolfPhase.Nighttime) {
    return (
      <PlayerGameNightScreen gameState={gameState} phase={turnState.phase} />
    );
  }

  return <PlayerGameDayScreen gameState={gameState} />;
}
