"use client";

import type { PlayerGameState } from "@/server/models";
import { GameRolesList, PlayersRoleList } from "..";

interface Props {
  gameState: PlayerGameState;
}

export function OwnerGameScreen({ gameState }: Props) {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Game In Progress</h1>
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
