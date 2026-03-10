"use client";

import type { PlayerGameState } from "@/server/models";
import type { Team } from "@/lib/models";
import PlayersRoleList from "./PlayersRoleList";
import GameRolesList from "./GameRolesList";

interface Props {
  gameState: PlayerGameState;
  teamLabels: Partial<Record<Team, string>> | undefined;
}

export default function OwnerGameScreen({ gameState, teamLabels }: Props) {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Game In Progress</h1>
      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        teamLabels={teamLabels}
      />
      <GameRolesList roles={gameState.rolesInPlay ?? []} />
    </div>
  );
}
