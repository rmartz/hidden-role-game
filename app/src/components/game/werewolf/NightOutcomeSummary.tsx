import { getPhaseLabel } from "@/lib/game-modes/werewolf";
import type { NightResolutionEvent } from "@/lib/game-modes/werewolf";

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
        {nightResolution.map((event) => {
          const playerName =
            players.find((p) => p.id === event.targetPlayerId)?.name ??
            event.targetPlayerId;
          const attackerLabels = event.attackedBy.map((k) =>
            getPhaseLabel(k, roles),
          );
          const protectorLabels = event.protectedBy.map((k) =>
            getPhaseLabel(k, roles),
          );
          return (
            <li key={event.targetPlayerId}>
              <strong className="text-foreground">{playerName}</strong>
              {attackerLabels.length > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  — attacked by {attackerLabels.join(", ")}
                </span>
              )}
              {protectorLabels.length > 0 && (
                <span className="text-muted-foreground">
                  , protected by {protectorLabels.join(", ")}
                </span>
              )}
              <span
                className={
                  event.died
                    ? "ml-1 text-destructive font-medium"
                    : "ml-1 text-green-600 font-medium"
                }
              >
                {event.died ? "(killed)" : "(survived)"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
