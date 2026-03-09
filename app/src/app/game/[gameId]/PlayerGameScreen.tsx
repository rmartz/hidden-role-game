"use client";

import { GameStatus } from "@/lib/models";
import type { PlayerGameState } from "@/server/models";
import PlayersRoleList from "./PlayersRoleList";
import GameRolesList from "./GameRolesList";
import RoleLabel from "./RoleLabel";

interface Props {
  gameState: PlayerGameState;
}

export default function PlayerGameScreen({ gameState }: Props) {
  const { status } = gameState;
  if (status.type !== GameStatus.Playing) return null;

  const { turnState } = status;

  if (turnState?.phase.type === "nighttime") {
    const { nightPhaseOrder, currentPhaseIndex } = turnState.phase;
    const isMyTurn = gameState.myRole?.id === nightPhaseOrder[currentPhaseIndex];

    if (!isMyTurn) return <div />;

    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1>It&apos;s Your Turn</h1>
        <p>
          <strong>{gameState.myRole?.name}</strong> — wake up and take your
          action.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>
      <p>The game is underway.</p>

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
