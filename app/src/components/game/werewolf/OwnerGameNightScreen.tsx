"use client";

import { GAME_MODES } from "@/lib/game-modes";
import { WerewolfPhase, WerewolfAction } from "@/lib/game-modes/werewolf";
import { getTargetablePlayers } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { GameRolesList, PlayersRoleList } from "@/components/game";
import { Button } from "@/components/ui/button";

interface Props {
  gameId: string;
  gameState: PlayerGameState;
  turnState: WerewolfTurnState;
}

export function OwnerGameNightScreen({ gameId, gameState, turnState }: Props) {
  const action = useGameAction(gameId);

  const { phase } = turnState;
  if (phase.type !== WerewolfPhase.Nighttime) return null;

  const { nightPhaseOrder, currentPhaseIndex, nightActions } = phase;
  const activeRoleId = nightPhaseOrder[currentPhaseIndex] ?? "";
  const modeConfig = GAME_MODES[gameState.gameMode];
  const activeRoleName =
    (activeRoleId ? modeConfig.roles[activeRoleId]?.name : undefined) ??
    activeRoleId;
  const isLastPhase = currentPhaseIndex === nightPhaseOrder.length - 1;

  const activeTarget = nightActions[activeRoleId]?.targetPlayerId;
  const activeTargetName = activeTarget
    ? gameState.players.find((p) => p.id === activeTarget)?.name
    : undefined;

  const isFirstTurn = turnState.turn === 1;

  const targetablePlayers = getTargetablePlayers(
    gameState.players,
    gameState.gameOwner?.id,
    turnState.deadPlayerIds,
  );

  function handleTargetClick(playerId: string) {
    if (activeTarget === playerId) {
      action.mutate({
        actionId: WerewolfAction.ClearNightTarget,
        payload: { roleId: activeRoleId },
      });
    } else {
      action.mutate({
        actionId: WerewolfAction.SetNightTarget,
        payload: {
          roleId: activeRoleId,
          targetPlayerId: playerId,
        },
      });
    }
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">
        Night — Turn {turnState.turn} ({currentPhaseIndex + 1}/
        {nightPhaseOrder.length})
      </h1>
      <p className="mb-4 text-muted-foreground">
        Currently awake:{" "}
        <strong className="text-foreground">{activeRoleName}</strong>
      </p>

      {!isFirstTurn && (
        <div className="mb-4 rounded-md border p-3">
          <p className="text-sm font-medium mb-2">
            Target:{" "}
            {activeTargetName ? (
              <strong className="text-foreground">{activeTargetName}</strong>
            ) : (
              <span className="text-muted-foreground italic">none</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {targetablePlayers.map((player) => (
              <Button
                key={player.id}
                size="sm"
                variant={activeTarget === player.id ? "default" : "outline"}
                onClick={() => {
                  handleTargetClick(player.id);
                }}
                disabled={action.isPending}
              >
                {player.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isLastPhase ? (
        <Button
          onClick={() => {
            action.mutate({ actionId: WerewolfAction.StartDay });
          }}
          disabled={action.isPending}
          className="mb-5"
        >
          Start the Day
        </Button>
      ) : (
        <Button
          onClick={() => {
            action.mutate({
              actionId: WerewolfAction.SetNightPhase,
              payload: { phaseIndex: currentPhaseIndex + 1 },
            });
          }}
          disabled={action.isPending}
          className="mb-5"
        >
          Next Role
        </Button>
      )}
      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        deadPlayerIds={gameState.deadPlayerIds}
        renderActions={(playerId, isDead) =>
          playerId !== gameState.gameOwner?.id &&
          (isDead ? (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                action.mutate({
                  actionId: WerewolfAction.MarkPlayerAlive,
                  payload: { playerId },
                });
              }}
              disabled={action.isPending}
            >
              Revive
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="xs"
              onClick={() => {
                if (window.confirm("Mark this player as dead?")) {
                  action.mutate({
                    actionId: WerewolfAction.MarkPlayerDead,
                    payload: { playerId },
                  });
                }
              }}
              disabled={action.isPending}
            >
              Kill
            </Button>
          ))
        }
      />
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
        selectedRoleId={activeRoleId}
        onSelectedIdChange={(roleId) => {
          const newIndex = nightPhaseOrder.indexOf(roleId);
          if (newIndex !== -1)
            action.mutate({
              actionId: WerewolfAction.SetNightPhase,
              payload: { phaseIndex: newIndex },
            });
        }}
      />
    </div>
  );
}
