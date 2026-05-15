import { groupBy } from "lodash";

import type {
  AltruistInterceptedNightResolutionEvent,
  NightResolutionEvent,
} from "@/lib/game/modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import { getPlayerName } from "@/lib/player";

import { NightOutcomeSummaryItem } from "./NightOutcomeSummaryItem";

interface NightOutcomeSummaryProps {
  events: NightResolutionEvent[];
  players: { id: string; name: string }[];
  roles: Record<string, { name: string }>;
  knightedPlayerId?: string;
}

export function NightOutcomeSummary({
  events,
  players,
  roles,
  knightedPlayerId,
}: NightOutcomeSummaryProps) {
  if (events.length === 0 && !knightedPlayerId) return null;

  const altruistIntercept = events.find(
    (e): e is AltruistInterceptedNightResolutionEvent =>
      e.type === "altruist-intercepted",
  );
  const regularEvents = events.filter(
    (e) => e.type !== "altruist-intercepted" && e.type !== "swapper-swapped",
  );

  // Group events by targetPlayerId so a player attacked and silenced in the
  // same night is represented by a single list item.
  const eventsPerPlayer = groupBy(regularEvents, "targetPlayerId");
  const targetPlayerIds = Object.keys(eventsPerPlayer);
  if (
    knightedPlayerId !== undefined &&
    eventsPerPlayer[knightedPlayerId] === undefined
  ) {
    targetPlayerIds.push(knightedPlayerId);
  }

  return (
    <div className="mb-4 rounded-md border p-3">
      <h2 className="text-sm font-semibold mb-2">Night Summary</h2>
      <ul className="space-y-1 text-sm">
        {altruistIntercept && (
          <li className="font-medium text-blue-600">
            {WEREWOLF_COPY.altruist.dayAnnouncement(
              getPlayerName(players, altruistIntercept.altruistPlayerId) ??
                "The Altruist",
              getPlayerName(players, altruistIntercept.savedPlayerId) ??
                "a player",
            )}
          </li>
        )}
        {targetPlayerIds.map((targetPlayerId) => (
          <li key={targetPlayerId}>
            <NightOutcomeSummaryItem
              playerName={
                getPlayerName(players, targetPlayerId) ?? targetPlayerId
              }
              events={eventsPerPlayer[targetPlayerId]}
              roles={roles}
              knighted={targetPlayerId === knightedPlayerId}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
