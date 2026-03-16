import type { NightResolutionEvent } from "@/lib/game-modes/werewolf";
import { NightOutcomeSummaryItem } from "./NightOutcomeSummaryItem";
import { getPlayerName } from "@/lib/player-utils";

interface NightOutcomeSummaryProps {
  events: NightResolutionEvent[];
  players: { id: string; name: string }[];
  roles: Record<string, { name: string }>;
}

export function NightOutcomeSummary({
  events,
  players,
  roles,
}: NightOutcomeSummaryProps) {
  if (events.length === 0) return null;

  return (
    <div className="mb-4 rounded-md border p-3">
      <h2 className="text-sm font-semibold mb-2">Night Summary</h2>
      <ul className="space-y-1 text-sm">
        {events.map((e) =>
          e.type === "combat" ? (
            <NightOutcomeSummaryItem
              key={e.targetPlayerId}
              event={e}
              playerName={
                getPlayerName(players, e.targetPlayerId) ?? e.targetPlayerId
              }
              roles={roles}
            />
          ) : (
            <li key={e.targetPlayerId}>
              <strong className="text-foreground">
                {getPlayerName(players, e.targetPlayerId) ?? e.targetPlayerId}
              </strong>
              <span className="ml-1 text-yellow-600 font-medium">
                (silenced)
              </span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
