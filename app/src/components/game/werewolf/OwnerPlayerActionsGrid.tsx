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
  trialBlocked?: boolean;
  smitedPlayerIds?: string[];
}

export function OwnerPlayerActionsGrid({
  gameId,
  assignments,
  gameMode,
  deadPlayerIds,
  gameOwnerId,
  isDaytime,
  trialBlocked,
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
            trialBlocked={trialBlocked}
            isSmited={smitedPlayerIds?.includes(playerId)}
          />
        )
      }
    />
  );
}
