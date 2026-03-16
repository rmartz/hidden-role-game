"use client";

import groupBy from "lodash/groupBy";
import { getPlayerName } from "@/lib/player-utils";
import type { PlayerGameState } from "@/server/types";
import { PlayerNightSummaryItem } from "./PlayerNightSummaryItem";

interface PlayerNightSummaryProps {
  players: PlayerGameState["players"];
  nightStatus?: PlayerGameState["nightStatus"];
}

export function PlayerNightSummary({
  players,
  nightStatus,
}: PlayerNightSummaryProps) {
  const byPlayer = groupBy(nightStatus ?? [], (e) => e.targetPlayerId);
  const playerEntries = Object.entries(byPlayer).map(
    ([targetPlayerId, entries]) => ({
      targetPlayerId,
      playerName: getPlayerName(players, targetPlayerId) ?? targetPlayerId,
      killed: entries.some((e) => e.effect === "killed"),
      silenced: entries.some((e) => e.effect === "silenced"),
    }),
  );

  if (playerEntries.length === 0) return null;

  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold mb-2">Last Night</h2>
      <ul className="space-y-1">
        {playerEntries.map(
          ({ targetPlayerId, playerName, killed, silenced }) => (
            <PlayerNightSummaryItem
              key={targetPlayerId}
              playerName={playerName}
              killed={killed}
              silenced={silenced}
            />
          ),
        )}
      </ul>
    </div>
  );
}
