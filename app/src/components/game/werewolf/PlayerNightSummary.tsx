"use client";

import { getActionText } from "@/lib/game-modes/werewolf";
import { getPlayer } from "@/lib/player-utils";
import type { PlayerGameState } from "@/server/types";

interface PlayerNightSummaryProps {
  players: PlayerGameState["players"];
  nightSummary: PlayerGameState["nightSummary"];
  myLastNightAction: PlayerGameState["myLastNightAction"];
}

export function PlayerNightSummary({
  players,
  nightSummary,
  myLastNightAction,
}: PlayerNightSummaryProps) {
  const hasDeaths = (nightSummary?.length ?? 0) > 0;
  if (!hasDeaths && !myLastNightAction) return null;

  const killedEntries = (nightSummary ?? []).map((event) => ({
    key: event.targetPlayerId,
    name:
      getPlayer(players, event.targetPlayerId)?.name ?? event.targetPlayerId,
  }));

  const actionText = myLastNightAction
    ? getActionText(
        myLastNightAction.category,
        getPlayer(players, myLastNightAction.targetPlayerId)?.name ??
          myLastNightAction.targetPlayerId,
        nightSummary,
        myLastNightAction.targetPlayerId,
      )
    : null;

  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold mb-2">Last Night</h2>
      {hasDeaths ? (
        <ul className="space-y-1">
          {killedEntries.map((entry) => (
            <li key={entry.key} className="text-sm">
              {entry.name} was eliminated.
            </li>
          ))}
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
