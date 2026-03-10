"use client";

import { GAME_MODES } from "@/lib/game-modes";
import type { TurnState } from "@/lib/models";
import type { PlayerGameState } from "@/server/models";
import PlayersRoleList from "./PlayersRoleList";
import GameRolesList from "./GameRolesList";

interface Props {
  gameState: PlayerGameState;
  turnState: TurnState;
  onAdvancePhase: () => void;
  isAdvancePending: boolean;
}

export default function OwnerNightScreen({
  gameState,
  turnState,
  onAdvancePhase,
  isAdvancePending,
}: Props) {
  const { phase } = turnState;
  if (phase.type !== "nighttime") return null;

  const { nightPhaseOrder, currentPhaseIndex } = phase;
  const activeRoleId = nightPhaseOrder[currentPhaseIndex] ?? "";
  const modeConfig = GAME_MODES[gameState.gameMode];
  const activeRoleName =
    (activeRoleId ? modeConfig.roles[activeRoleId]?.name : undefined) ??
    activeRoleId;
  const isLastPhase = currentPhaseIndex === nightPhaseOrder.length - 1;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>
        Night — Turn {turnState.turn} ({currentPhaseIndex + 1}/
        {nightPhaseOrder.length})
      </h1>
      <p>
        Currently awake: <strong>{activeRoleName}</strong>
      </p>
      <button onClick={onAdvancePhase} disabled={isAdvancePending}>
        {isLastPhase ? "Start the Day" : "Next Role"}
      </button>
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
