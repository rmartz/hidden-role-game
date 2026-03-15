"use client";

import type { VisibleTeammate } from "@/server/types";
import type { GameMode } from "@/lib/types";
import { PlayersRoleList } from "@/components/game";
import { OwnerPlayerActionItem } from "./OwnerPlayerActionItem";

interface Props {
  gameId: string;
  assignments: VisibleTeammate[];
  gameMode: GameMode;
  deadPlayerIds?: string[];
  gameOwnerId?: string;
}

export function OwnerPlayerActionsGrid({
  gameId,
  assignments,
  gameMode,
  deadPlayerIds,
  gameOwnerId,
}: Props) {
  return (
    <PlayersRoleList
      assignments={assignments}
      gameMode={gameMode}
      deadPlayerIds={deadPlayerIds}
      renderActions={(playerId, isDead) =>
        playerId === gameOwnerId ? null : (
          <OwnerPlayerActionItem
            gameId={gameId}
            playerId={playerId}
            isDead={isDead}
          />
        )
      }
    />
  );
}
