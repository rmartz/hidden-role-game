"use client";

import type { PlayerGameState } from "@/server/models";
import {
  GameRolesList,
  GameStartCountdown,
  PlayersRoleList,
  RoleLabel,
} from "@/components/game";

const STARTING_DURATION_SECONDS = 10;

interface Props {
  gameState: PlayerGameState;
}

export function PlayerStartingScreen({ gameState }: Props) {
  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Game Starting</h1>
      <GameStartCountdown durationSeconds={STARTING_DURATION_SECONDS} />

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
