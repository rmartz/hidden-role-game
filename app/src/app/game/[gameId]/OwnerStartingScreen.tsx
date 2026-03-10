"use client";

import type { PlayerGameState } from "@/server/models";
import OwnerStartCountdown from "./OwnerStartCountdown";
import PlayersRoleList from "./PlayersRoleList";
import GameRolesList from "./GameRolesList";

interface Props {
  gameState: PlayerGameState;
  durationSeconds: number;
  onStart: () => void;
}

export default function OwnerStartingScreen({
  gameState,
  durationSeconds,
  onStart,
}: Props) {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Game Starting</h1>
      <OwnerStartCountdown
        durationSeconds={durationSeconds}
        onStart={onStart}
      />
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
