"use client";

import groupBy from "lodash/groupBy";
import { getPlayerName } from "@/lib/player-utils";
import type { PlayerGameState } from "@/server/types";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";
import { PlayerNightSummaryItem } from "./PlayerNightSummaryItem";

interface PlayerNightSummaryProps {
  players: PlayerGameState["players"];
  nightStatus?: PlayerGameState["nightStatus"];
  myPlayerId?: string;
  altruistSave?: PlayerGameState["altruistSave"];
}

export function PlayerNightSummary({
  players,
  nightStatus,
  myPlayerId,
  altruistSave,
}: PlayerNightSummaryProps) {
  const byPlayer = groupBy(nightStatus ?? [], (e) => e.targetPlayerId);
  const playerEntries = Object.entries(byPlayer).map(
    ([targetPlayerId, entries]) => ({
      targetPlayerId,
      playerName: getPlayerName(players, targetPlayerId) ?? targetPlayerId,
      killed: entries.some((e) => e.effect === "killed"),
      survived: entries.some((e) => e.effect === "survived"),
      silenced: entries.some((e) => e.effect === "silenced"),
      hypnotized: entries.some((e) => e.effect === "hypnotized"),
      smited: entries.some((e) => e.effect === "smited"),
    }),
  );

  if (playerEntries.length === 0 && !altruistSave) return null;

  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold mb-2">Last Night</h2>
      <ul className="space-y-1">
        {altruistSave && (
          <li className="text-sm font-medium text-blue-600">
            {WEREWOLF_COPY.altruist.dayAnnouncement(
              getPlayerName(players, altruistSave.altruistPlayerId) ??
                "The Altruist",
              getPlayerName(players, altruistSave.savedPlayerId) ?? "a player",
            )}
          </li>
        )}
        {playerEntries.map(
          ({
            targetPlayerId,
            playerName,
            killed,
            survived,
            silenced,
            hypnotized,
            smited,
          }) => (
            <PlayerNightSummaryItem
              key={targetPlayerId}
              playerName={playerName}
              killed={killed}
              survived={survived}
              silenced={silenced}
              hypnotized={hypnotized}
              smited={smited}
              isMe={myPlayerId === targetPlayerId}
            />
          ),
        )}
      </ul>
    </div>
  );
}
