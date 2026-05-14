"use client";

import type { GameMode } from "@/lib/types";
import type { VisibleTeammate } from "@/server/types";

import { NarratorPlayerRoleLists } from "./NarratorPlayerRoleLists";
import { OwnerPlayerActionItem } from "./OwnerPlayerActionItem";
import type { NightMarkerEffect } from "./NightActionMarker";

interface OwnerPlayerActionsGridProps {
  gameId: string;
  assignments: VisibleTeammate[];
  gameMode: GameMode;
  deadPlayerIds?: string[];
  gameOwnerId?: string;
  isDaytime?: boolean;
  trialBlocked?: boolean;
  smitedPlayerIds?: string[];
  executionerTargetId?: string;
  nightStatusMarkers?: Map<string, NightMarkerEffect[]>;
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
  executionerTargetId,
  nightStatusMarkers,
}: OwnerPlayerActionsGridProps) {
  return (
    <NarratorPlayerRoleLists
      assignments={assignments}
      gameMode={gameMode}
      deadPlayerIds={deadPlayerIds}
      executionerTargetId={executionerTargetId}
      nightStatusMarkers={nightStatusMarkers}
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
