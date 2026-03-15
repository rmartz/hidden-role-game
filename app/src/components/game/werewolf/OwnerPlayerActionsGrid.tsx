"use client";

import { WerewolfAction } from "@/lib/game-modes/werewolf";
import type { VisibleTeammate } from "@/server/types";
import type { GameMode } from "@/lib/types";
import { useGameAction } from "@/hooks";
import { PlayersRoleList } from "@/components/game";
import { Button } from "@/components/ui/button";

interface Props {
  gameId: string;
  assignments: VisibleTeammate[];
  gameMode: GameMode;
  deadPlayerIds: string[] | undefined;
  gameOwnerId: string | undefined;
}

export function OwnerPlayerActionsGrid({
  gameId,
  assignments,
  gameMode,
  deadPlayerIds,
  gameOwnerId,
}: Props) {
  const action = useGameAction(gameId);

  function renderActions(playerId: string, isDead: boolean) {
    if (playerId === gameOwnerId) return null;
    if (isDead) {
      return (
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
      );
    }
    return (
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
    );
  }

  return (
    <PlayersRoleList
      assignments={assignments}
      gameMode={gameMode}
      deadPlayerIds={deadPlayerIds}
      renderActions={renderActions}
    />
  );
}
