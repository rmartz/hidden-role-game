"use client";

import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { GameRolesList } from "@/components/game";
import { NarratorPlayerRoleLists } from "./NarratorPlayerRoleLists";

interface OwnerGameScreenProps {
  gameState: WerewolfPlayerGameState;
}

export function OwnerGameScreen({ gameState }: OwnerGameScreenProps) {
  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Game In Progress</h1>
      <NarratorPlayerRoleLists
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        deadPlayerIds={gameState.deadPlayerIds ?? []}
        executionerTargetId={gameState.executionerTargetId}
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
