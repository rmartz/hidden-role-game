"use client";

import type { PlayerGameState } from "@/server/types";
import { GameRolesList } from "@/components/game";
import { NarratorPlayerRoleLists } from "./NarratorPlayerRoleLists";

interface OwnerGameScreenProps {
  gameState: PlayerGameState;
}

export function OwnerGameScreen({ gameState }: OwnerGameScreenProps) {
  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Game In Progress</h1>
      <NarratorPlayerRoleLists
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        deadPlayerIds={gameState.deadPlayerIds ?? []}
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
