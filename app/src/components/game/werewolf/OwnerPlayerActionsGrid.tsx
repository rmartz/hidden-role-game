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
}

export function OwnerPlayerActionsGrid({
  gameId,
  assignments,
  gameMode,
  deadPlayerIds,
  gameOwnerId,
  isDaytime,
  hasActiveTrial,
}: OwnerPlayerActionsGridProps) {
  return (
    <NarratorPlayerRoleLists
      assignments={assignments}
      gameMode={gameMode}
      deadPlayerIds={deadPlayerIds}
      renderActions={(playerId, isDead) =>
        playerId === gameOwnerId ? null : (
          <OwnerPlayerActionItem
            gameId={gameId}
            playerId={playerId}
            isDead={isDead}
            isDaytime={isDaytime}
            hasActiveTrial={hasActiveTrial}
          />
        )
      }
    />
  );
}
