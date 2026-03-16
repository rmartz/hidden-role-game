"use client";

import { getActionText } from "@/lib/game-modes/werewolf";
import { getPlayerName } from "@/lib/player-utils";
import type { PlayerGameState } from "@/server/types";

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
  const killedEntries = (nightStatus ?? []).filter(
    (e) => e.effect === "killed",
  );
  const silencedEntries = (nightStatus ?? []).filter(
    (e) => e.effect === "silenced",
  );
  const hasEvents = killedEntries.length > 0 || silencedEntries.length > 0;
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
          {killedEntries.map((entry) => (
            <li key={entry.targetPlayerId} className="text-sm">
              {getPlayerName(players, entry.targetPlayerId) ??
                entry.targetPlayerId}{" "}
              was eliminated.
            </li>
          ))}
          {silencedEntries.map((entry) => (
            <li key={entry.targetPlayerId} className="text-sm">
              {getPlayerName(players, entry.targetPlayerId) ??
                entry.targetPlayerId}{" "}
              was silenced.
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
