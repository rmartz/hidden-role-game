"use client";

import type { PlayerGameState } from "@/server/models";
import {
  GameRolesList,
  GameStartCountdown,
  PlayersRoleList,
  RoleLabel,
} from "../components";

const STARTING_DURATION_SECONDS = 10;

interface Props {
  gameState: PlayerGameState;
}

export function PlayerStartingScreen({ gameState }: Props) {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Game Starting</h1>
      <GameStartCountdown durationSeconds={STARTING_DURATION_SECONDS} />

      {gameState.myRole && (
        <div style={{ marginBottom: "20px" }}>
          <h2>Your Role</h2>
          <p>
            <RoleLabel role={gameState.myRole} gameMode={gameState.gameMode} />
          </p>
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
