"use client";

import { getPlayerName } from "@/lib/player-utils";
import type { PublicLobbyPlayer } from "@/server/types";

interface Props {
  players: PublicLobbyPlayer[];
  witchAbilityUsed: boolean;
  attackedPlayerIds: string[];
}

export function WitchInformationPanel({
  players,
  witchAbilityUsed,
  attackedPlayerIds,
}: Props) {
  if (witchAbilityUsed) {
    return (
      <p className="mb-4 text-sm text-muted-foreground italic">
        You have already used your special ability this game.
      </p>
    );
  }

  if (attackedPlayerIds.length === 0) return null;

  return (
    <div className="mb-4 rounded-md border p-3 text-sm">
      <p className="font-medium mb-1">Currently under attack:</p>
      <ul className="space-y-0.5">
        {attackedPlayerIds.map((id) => (
          <li key={id}>{getPlayerName(players, id) ?? id}</li>
        ))}
      </ul>
    </div>
  );
}
