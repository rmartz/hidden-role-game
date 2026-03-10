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
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>It&apos;s Your Turn</h1>
      <p>
        <strong>{gameState.myRole?.name}</strong> — wake up and take your
        action.
      </p>
    </div>
  );
}
