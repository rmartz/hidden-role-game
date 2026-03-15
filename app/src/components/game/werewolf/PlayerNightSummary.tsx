"use client";

import { getActionText } from "@/lib/game-modes/werewolf";
import { getPlayerName } from "@/lib/player-utils";
import type { PlayerGameState } from "@/server/types";

interface PlayerNightSummaryProps {
  players: PlayerGameState["players"];
  nightSummary: PlayerGameState["nightSummary"];
  myLastNightAction: PlayerGameState["myLastNightAction"];
  silencedPlayerIds?: PlayerGameState["silencedPlayerIds"];
}

export function PlayerNightSummary({
  players,
  nightSummary,
  myLastNightAction,
  silencedPlayerIds,
}: PlayerNightSummaryProps) {
  const hasDeaths = (nightSummary?.length ?? 0) > 0;
  const hasSilenced = (silencedPlayerIds?.length ?? 0) > 0;
  if (!hasDeaths && !hasSilenced && !myLastNightAction) return null;

  const killedEntries = (nightSummary ?? []).map((event) => ({
    key: event.targetPlayerId,
    name: getPlayerName(players, event.targetPlayerId) ?? event.targetPlayerId,
  }));

  const actionText = myLastNightAction
    ? getActionText(
        myLastNightAction.category,
        getPlayerName(players, myLastNightAction.targetPlayerId) ??
          myLastNightAction.targetPlayerId,
        nightSummary,
        myLastNightAction.targetPlayerId,
      )
    : null;

  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold mb-2">Last Night</h2>
      {hasDeaths || hasSilenced ? (
        <ul className="space-y-1">
          {killedEntries.map((entry) => (
            <li key={entry.key} className="text-sm">
              {entry.name} was eliminated.
            </li>
          ))}
          {(silencedPlayerIds ?? []).map((id) => (
            <li key={id} className="text-sm">
              {getPlayerName(players, id) ?? id} was silenced.
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
