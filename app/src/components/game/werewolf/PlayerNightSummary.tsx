"use client";

import { TargetCategory } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";

interface Props {
  players: PlayerGameState["players"];
  nightSummary: PlayerGameState["nightSummary"];
  myLastNightAction: PlayerGameState["myLastNightAction"];
}

function getActionText(
  category: TargetCategory,
  targetName: string,
  targetWasKilled: boolean,
): string {
  switch (category) {
    case TargetCategory.Protect:
      return `You Protected ${targetName}.`;
    case TargetCategory.Investigate:
      return `You Investigated ${targetName}.`;
    case TargetCategory.Attack:
      return targetWasKilled
        ? `You Attacked ${targetName}.`
        : `You Attacked ${targetName}, but something protected them.`;
    default:
      return `You targeted ${targetName}.`;
  }
}

export function PlayerNightSummary({
  players,
  nightSummary,
  myLastNightAction,
}: Props) {
  const hasDeaths = (nightSummary?.length ?? 0) > 0;
  if (!hasDeaths && !myLastNightAction) return null;

  const killedEntries = (nightSummary ?? []).map((event) => ({
    key: event.targetPlayerId,
    name:
      players.find((p) => p.id === event.targetPlayerId)?.name ??
      event.targetPlayerId,
  }));

  const actionText = myLastNightAction
    ? getActionText(
        myLastNightAction.category,
        players.find((p) => p.id === myLastNightAction.targetPlayerId)?.name ??
          myLastNightAction.targetPlayerId,
        (nightSummary ?? []).some(
          (e) =>
            e.died && e.targetPlayerId === myLastNightAction.targetPlayerId,
        ),
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
