"use client";

import groupBy from "lodash/groupBy";
import { getActionText } from "@/lib/game-modes/werewolf";
import { getPlayerName } from "@/lib/player-utils";
import type { PlayerGameState } from "@/server/types";
import { PlayerNightSummaryItem } from "./PlayerNightSummaryItem";

interface PlayerNightSummaryProps {
  players: PlayerGameState["players"];
  nightStatus?: PlayerGameState["nightStatus"];
  myLastNightAction: PlayerGameState["myLastNightAction"];
}

export function PlayerNightSummary({
  players,
  nightStatus,
  myLastNightAction,
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

  const hasEvents = playerEntries.length > 0;
  if (!hasEvents && !myLastNightAction) return null;

  const actionText = myLastNightAction
    ? getActionText(
        myLastNightAction.category,
        getPlayerName(players, myLastNightAction.targetPlayerId) ??
          myLastNightAction.targetPlayerId,
        nightStatus,
        myLastNightAction.targetPlayerId,
      )
    : null;

  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold mb-2">Last Night</h2>
      {hasEvents ? (
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
      ) : (
        <p className="text-sm text-muted-foreground">Nothing happened.</p>
      )}
      {actionText && (
        <p className="mt-2 text-sm text-muted-foreground">{actionText}</p>
      )}
    </div>
  );
}
