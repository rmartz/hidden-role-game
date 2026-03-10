"use client";

import type { PlayerGameState } from "@/server/models";
import PlayersRoleList from "./PlayersRoleList";
import GameRolesList from "./GameRolesList";

interface Props {
  gameState: PlayerGameState;
}

export default function OwnerGameScreen({ gameState }: Props) {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Game In Progress</h1>
      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
      />
      <GameRolesList roles={gameState.rolesInPlay ?? []} />
    </div>
  );
}
