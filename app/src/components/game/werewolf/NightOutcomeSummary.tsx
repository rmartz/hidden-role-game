import type { NightResolutionEvent } from "@/lib/game-modes/werewolf";
import { NightOutcomeSummaryItem } from "./NightOutcomeSummaryItem";

interface Props {
  nightResolution: NightResolutionEvent[];
  players: { id: string; name: string }[];
  roles: Record<string, { name: string }>;
}

export function NightOutcomeSummary({
  nightResolution,
  players,
  roles,
}: Props) {
  if (nightResolution.length === 0) return null;

  return (
    <div className="mb-4 rounded-md border p-3">
      <h2 className="text-sm font-semibold mb-2">Night Summary</h2>
      <ul className="space-y-1 text-sm">
        {nightResolution.map((event) => (
          <NightOutcomeSummaryItem
            key={event.targetPlayerId}
            event={event}
            playerName={
              players.find((p) => p.id === event.targetPlayerId)?.name ??
              event.targetPlayerId
            }
            roles={roles}
          />
        ))}
      </ul>
    </div>
  );
}
