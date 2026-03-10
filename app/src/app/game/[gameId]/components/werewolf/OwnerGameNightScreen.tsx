"use client";

import { GAME_MODES } from "@/lib/game-modes";
import { WerewolfPhase } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/models";
import { useSetPhaseIndex } from "@/hooks";
import { GameRolesList, PlayersRoleList } from "..";

interface Props {
  gameId: string;
  gameState: PlayerGameState;
  turnState: WerewolfTurnState;
  onAdvancePhase: () => void;
  isAdvancePending: boolean;
}

export function OwnerGameNightScreen({
  gameId,
  gameState,
  turnState,
  onAdvancePhase,
  isAdvancePending,
}: Props) {
  const setPhaseIndexMutation = useSetPhaseIndex(gameId);

  const { phase } = turnState;
  if (phase.type !== WerewolfPhase.Nighttime) return null;

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
        selectedRoleId={activeRoleId}
        onSelectedIdChange={(roleId) => {
          const newIndex = nightPhaseOrder.indexOf(roleId);
          if (newIndex !== -1) setPhaseIndexMutation.mutate(newIndex);
        }}
      />
    </div>
  );
}
