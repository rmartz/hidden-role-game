"use client";

import type { VisibleTeammate } from "@/server/types";
import type { GameMode } from "@/lib/types";
import { PlayersRoleList } from "@/components/game";
import { OwnerPlayerActionItem } from "./OwnerPlayerActionItem";

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
  function renderActions(playerId: string, isDead: boolean) {
    if (playerId === gameOwnerId) return null;
    return (
      <OwnerPlayerActionItem
        gameId={gameId}
        playerId={playerId}
        isDead={isDead}
      />
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
