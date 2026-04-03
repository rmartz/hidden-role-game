"use client";

import { isPlayersTurn } from "@/lib/game-modes/werewolf";
import type { WerewolfNighttimePhase } from "@/lib/game-modes/werewolf";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";
import { PlayerNightSnoozeScreen } from "./PlayerNightSnoozeScreen";
import { PlayerNightActionScreen } from "./PlayerNightActionScreen";

interface PlayerGameNightScreenProps {
  gameId: string;
  gameState: WerewolfPlayerGameState;
  phase: WerewolfNighttimePhase;
  turn: number;
  deadPlayerIds: string[];
}

export function PlayerGameNightScreen({
  gameId,
  gameState,
  phase,
  turn,
  deadPlayerIds,
}: PlayerGameNightScreenProps) {
  const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
  const isMyTurn = isPlayersTurn(gameState.myRole, activePhaseKey);

  const isSnoozing = (gameState.amDead ?? false) || !isMyTurn;

  return isSnoozing ? (
    <PlayerNightSnoozeScreen amDead={gameState.amDead ?? false} />
  ) : (
    <PlayerNightActionScreen
      gameId={gameId}
      gameState={gameState}
      phase={phase}
      turn={turn}
      deadPlayerIds={deadPlayerIds}
    />
  );
}
