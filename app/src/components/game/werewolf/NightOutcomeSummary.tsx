import type { NightResolutionEvent } from "@/lib/game-modes/werewolf";
import { NightOutcomeSummaryItem } from "./NightOutcomeSummaryItem";
import { getPlayerName } from "@/lib/player-utils";
import { groupBy } from "lodash";

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

  // Group events by targetPlayerId so a player attacked and silenced in the
  // same night is represented by a single list item.
  const eventsPerPlayer = groupBy(events, "targetPlayerId");

  return (
    <div className="mb-4 rounded-md border p-3">
      <h2 className="text-sm font-semibold mb-2">Night Summary</h2>
      <ul className="space-y-1 text-sm">
        {Object.entries(eventsPerPlayer).map(([targetPlayerId, events]) => (
          <li key={targetPlayerId}>
            <NightOutcomeSummaryItem
              playerName={
                getPlayerName(players, targetPlayerId) ?? targetPlayerId
              }
              events={events}
              roles={roles}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
