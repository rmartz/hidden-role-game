"use client";

import type { PlayerGameState } from "@/server/types";
import { GameRolesList, PlayersRoleList } from "@/components/game";

interface Props {
  gameState: PlayerGameState;
}

export function OwnerGameScreen({ gameState }: Props) {
  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Game In Progress</h1>
      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
