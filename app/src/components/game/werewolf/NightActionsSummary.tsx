import { buildNightSummary } from "@/lib/game-modes/werewolf";
import type { AnyNightAction } from "@/lib/game-modes/werewolf";

interface Props {
  nightActions: Record<string, AnyNightAction>;
  players: { id: string; name: string }[];
  roles: Record<string, { name: string }>;
}

export function NightActionsSummary({ nightActions, players, roles }: Props) {
  const entries = buildNightSummary(nightActions, players, roles);

  if (entries.length === 0) return null;

  return (
    <div className="mb-4 rounded-md border p-3">
      <h2 className="text-sm font-semibold mb-2">Night Summary</h2>
      <ul className="space-y-1 text-sm">
        {entries.map(({ targetId, playerName, labels }) => (
          <li key={targetId}>
            <strong className="text-foreground">{playerName}</strong>
            <span className="text-muted-foreground">
              {" "}
              — targeted by {labels.join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
