import type { NightResolutionEvent } from "@/lib/game-modes/werewolf";
import { NightOutcomeSummaryItem } from "./NightOutcomeSummaryItem";
import { getPlayerName } from "@/lib/player-utils";

interface NightOutcomeSummaryProps {
  nightResolution: NightResolutionEvent[];
  silencedPlayerIds?: string[];
  players: { id: string; name: string }[];
  roles: Record<string, { name: string }>;
}

export function NightOutcomeSummary({
  nightResolution,
  silencedPlayerIds = [],
  players,
  roles,
}: NightOutcomeSummaryProps) {
  if (nightResolution.length === 0 && silencedPlayerIds.length === 0)
    return null;

  return (
    <div className="mb-4 rounded-md border p-3">
      <h2 className="text-sm font-semibold mb-2">Night Summary</h2>
      <ul className="space-y-1 text-sm">
        {nightResolution.map((event) => (
          <NightOutcomeSummaryItem
            key={event.targetPlayerId}
            event={event}
            playerName={
              getPlayerName(players, event.targetPlayerId) ??
              event.targetPlayerId
            }
            roles={roles}
          />
        ))}
        {silencedPlayerIds.map((id) => (
          <li key={id}>
            <strong className="text-foreground">
              {getPlayerName(players, id) ?? id}
            </strong>
            <span className="ml-1 text-yellow-600 font-medium">(silenced)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
