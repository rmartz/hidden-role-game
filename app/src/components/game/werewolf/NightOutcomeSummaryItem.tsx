import { getPhaseLabel } from "@/lib/game-modes/werewolf";
import type { NightResolutionEvent } from "@/lib/game-modes/werewolf";

interface Props {
  event: NightResolutionEvent;
  playerName: string;
  roles: Record<string, { name: string }>;
}

export function NightOutcomeSummaryItem({ event, playerName, roles }: Props) {
  const attackerLabels = event.attackedBy.map((k) => getPhaseLabel(k, roles));
  const protectorLabels = event.protectedBy.map((k) => getPhaseLabel(k, roles));

  return (
    <li>
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
}
