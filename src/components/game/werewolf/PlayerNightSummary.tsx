"use client";

import groupBy from "lodash/groupBy";
import { getPlayerName } from "@/lib/player-utils";
import type { PlayerGameState } from "@/server/types";
import type { DaytimeNightStatusEntry } from "@/server/types";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";
import { PlayerNightSummaryItem } from "./PlayerNightSummaryItem";

interface PlayerNightSummaryProps {
  players: PlayerGameState["players"];
  nightStatus?: WerewolfPlayerGameState["nightStatus"];
  myPlayerId?: string;
}

export function PlayerNightSummary({
  players,
  nightStatus,
  myPlayerId,
}: PlayerNightSummaryProps) {
  const byPlayer = groupBy(nightStatus ?? [], (e) => e.targetPlayerId);
  const playerEntries = Object.entries(byPlayer).map(
    ([targetPlayerId, entries]) => {
      const altruistEntry = entries.find(
        (e): e is DaytimeNightStatusEntry & { savedPlayerId: string } =>
          e.effect === "altruist-sacrifice" &&
          "savedPlayerId" in e &&
          typeof e.savedPlayerId === "string",
      );
      const savedPlayerName = altruistEntry
        ? (getPlayerName(players, altruistEntry.savedPlayerId) ?? "a player")
        : undefined;

      return {
        targetPlayerId,
        playerName: getPlayerName(players, targetPlayerId) ?? targetPlayerId,
        killed: entries.some((e) => e.effect === "killed"),
        altruistSacrifice: entries.some(
          (e) => e.effect === "altruist-sacrifice",
        ),
        savedPlayerName,
        protected: entries.some((e) => e.effect === "protected"),
        survived: entries.some((e) => e.effect === "survived"),
        silenced: entries.some((e) => e.effect === "silenced"),
        hypnotized: entries.some((e) => e.effect === "hypnotized"),
        smited: entries.some((e) => e.effect === "smited"),
        peaceful: entries.some((e) => e.effect === "peaceful"),
      };
    },
  );

  if (playerEntries.length === 0) return null;

  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold mb-2">Last Night</h2>
      <ul className="space-y-1">
        {playerEntries.map(
          ({
            targetPlayerId,
            playerName,
            killed,
            altruistSacrifice,
            savedPlayerName,
            protected: wasProtected,
            survived,
            silenced,
            hypnotized,
            smited,
            peaceful,
          }) => (
            <PlayerNightSummaryItem
              key={targetPlayerId}
              playerName={playerName}
              killed={killed}
              altruistSacrifice={altruistSacrifice}
              savedPlayerName={savedPlayerName}
              protected={wasProtected}
              survived={survived}
              silenced={silenced}
              hypnotized={hypnotized}
              smited={smited}
              peaceful={peaceful}
              isMe={myPlayerId === targetPlayerId}
            />
          ),
        )}
      </ul>
    </div>
  );
}
