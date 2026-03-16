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

  // Group events by targetPlayerId so a player attacked and silenced in the
  // same night is represented by a single list item.
  const grouped = new Map<
    string,
    {
      killedEvent?: Extract<NightResolutionEvent, { type: "killed" }>;
      silenced: boolean;
    }
  >();
  for (const e of events) {
    const existing = grouped.get(e.targetPlayerId) ?? { silenced: false };
    if (!grouped.has(e.targetPlayerId)) grouped.set(e.targetPlayerId, existing);
    if (e.type === "killed") existing.killedEvent = e;
    if (e.type === "silenced") existing.silenced = true;
  }

  return (
    <div className="mb-4 rounded-md border p-3">
      <h2 className="text-sm font-semibold mb-2">Night Summary</h2>
      <ul className="space-y-1 text-sm">
        {Array.from(grouped.entries()).map(
          ([targetPlayerId, { killedEvent, silenced }]) => (
            <NightOutcomeSummaryItem
              key={targetPlayerId}
              playerName={
                getPlayerName(players, targetPlayerId) ?? targetPlayerId
              }
              killedEvent={killedEvent}
              silenced={silenced}
              roles={roles}
            />
          ),
        )}
      </ul>
    </div>
  );
}
