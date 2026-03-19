"use client";

import type { VisibleTeammate } from "@/server/types";
import type { GameMode } from "@/lib/types";
import { NarratorPlayerRoleLists } from "./NarratorPlayerRoleLists";
import { OwnerPlayerActionItem } from "./OwnerPlayerActionItem";

interface OwnerPlayerActionsGridProps {
  gameId: string;
  assignments: VisibleTeammate[];
  gameMode: GameMode;
  deadPlayerIds?: string[];
  gameOwnerId?: string;
  isDaytime?: boolean;
  hasActiveTrial?: boolean;
  smitedPlayerIds?: string[];
}

export function OwnerPlayerActionsGrid({
  gameId,
  assignments,
  gameMode,
  deadPlayerIds,
  gameOwnerId,
  isDaytime,
  hasActiveTrial,
  smitedPlayerIds,
}: OwnerPlayerActionsGridProps) {
  return (
    <NarratorPlayerRoleLists
      assignments={assignments}
      gameMode={gameMode}
      deadPlayerIds={deadPlayerIds}
      renderActions={(playerId, playerName, isDead) =>
        playerId === gameOwnerId ? null : (
          <OwnerPlayerActionItem
            gameId={gameId}
            playerId={playerId}
            playerName={playerName}
            isDead={isDead}
            isDaytime={isDaytime}
            hasActiveTrial={hasActiveTrial}
            isSmited={smitedPlayerIds?.includes(playerId)}
          />
        )
      }
    />
  );
}
