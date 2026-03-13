"use client";

import type { WerewolfNighttimePhase } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";

interface Props {
  gameState: PlayerGameState;
  phase: WerewolfNighttimePhase;
}

export function PlayerGameNightScreen({ gameState, phase }: Props) {
  if (gameState.amDead) {
    return (
      <div className="p-5">
        <h1 className="text-2xl font-bold mb-2 text-muted-foreground">
          You Have Been Eliminated
        </h1>
        <p className="text-muted-foreground">
          You are no longer in the game. Stay quiet while the night continues.
        </p>
      </div>
    );
  }

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
