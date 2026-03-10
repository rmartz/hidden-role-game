"use client";

import type { PlayerGameState } from "@/server/models";
import { GameRolesList, PlayersRoleList, RoleLabel } from "@/components/game";

interface Props {
  gameState: PlayerGameState;
}

export function PlayerGameDayScreen({ gameState }: Props) {
  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-2">Hidden Role Game</h1>
      <p className="mb-4 text-muted-foreground">The game is underway.</p>

      {gameState.myRole && (
        <div className="mb-5">
          <h2 className="text-lg font-semibold mb-2">Your Role</h2>
          <RoleLabel role={gameState.myRole} gameMode={gameState.gameMode} />
        </div>
      )}

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
