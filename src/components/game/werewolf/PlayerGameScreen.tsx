"use client";

import { GameStatus } from "@/lib/types";
import { WerewolfPhase } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";
import { useGameStateQuery } from "@/hooks";
import { PlayerGameNightScreen } from "./PlayerGameNightScreen";
import { PlayerGameDayScreen } from "./PlayerGameDayScreen";

const POLL_INTERVAL_MS = 2000;

interface PlayerGameScreenProps {
  gameId: string;
  gameState: WerewolfPlayerGameState;
}

export function PlayerGameScreen({ gameId, gameState }: PlayerGameScreenProps) {
  const { status } = gameState;

  const turnState =
    status.type === GameStatus.Playing
      ? (status.turnState as WerewolfTurnState | undefined)
      : undefined;

  const isNighttime = turnState?.phase.type === WerewolfPhase.Nighttime;

  // Poll throughout nighttime to detect when this player's turn starts or ends.
  useGameStateQuery(
    gameId,
    gameState.gameMode,
    isNighttime ? POLL_INTERVAL_MS : undefined,
  );

  if (status.type !== GameStatus.Playing || !turnState) return null;

  const isNightPhase =
    turnState.phase.type === WerewolfPhase.Nighttime
      ? turnState.phase
      : undefined;

  return isNightPhase ? (
    <PlayerGameNightScreen
      gameId={gameId}
      gameState={gameState}
      phase={isNightPhase}
      turn={turnState.turn}
      deadPlayerIds={turnState.deadPlayerIds}
    />
  ) : (
    <PlayerGameDayScreen
      gameId={gameId}
      gameState={gameState}
      turnState={turnState}
    />
  );
}
