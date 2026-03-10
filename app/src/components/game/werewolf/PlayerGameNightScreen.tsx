"use client";

import type { WerewolfNighttimePhase } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/models";

interface Props {
  gameState: PlayerGameState;
  phase: WerewolfNighttimePhase;
}

export function PlayerGameNightScreen({ gameState, phase }: Props) {
  const isMyTurn =
    gameState.myRole?.id === phase.nightPhaseOrder[phase.currentPhaseIndex];

  if (!isMyTurn) return <div />;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-2">It&apos;s Your Turn</h1>
      <p className="text-muted-foreground">
        <strong className="text-foreground">{gameState.myRole?.name}</strong> —
        wake up and take your action.
      </p>
    </div>
  );
}
