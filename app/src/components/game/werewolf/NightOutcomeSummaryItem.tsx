import { getPhaseLabel } from "@/lib/game-modes/werewolf";
import type { NightResolutionEvent } from "@/lib/game-modes/werewolf";

interface Props {
  playerName: string;
  killedEvent?: Extract<NightResolutionEvent, { type: "killed" }>;
  silenced: boolean;
  roles: Record<string, { name: string }>;
}

export function NightOutcomeSummaryItem({
  playerName,
  killedEvent,
  silenced,
  roles,
}: Props) {
  return (
    <li>
      <strong className="text-foreground">{playerName}</strong>
      {killedEvent && (
        <>
          {killedEvent.attackedBy.length > 0 && (
            <span className="text-muted-foreground">
              {" "}
              — attacked by{" "}
              {killedEvent.attackedBy
                .map((k) => getPhaseLabel(k, roles))
                .join(", ")}
            </span>
          )}
          {killedEvent.protectedBy.length > 0 && (
            <span className="text-muted-foreground">
              , protected by{" "}
              {killedEvent.protectedBy
                .map((k) => getPhaseLabel(k, roles))
                .join(", ")}
            </span>
          )}
          <span
            className={
              killedEvent.died
                ? "ml-1 text-destructive font-medium"
                : "ml-1 text-green-600 font-medium"
            }
          >
            {killedEvent.died ? "(killed)" : "(survived)"}
          </span>
        </>
      )}
      {silenced && (
        <span className="ml-1 text-yellow-600 font-medium">(silenced)</span>
      )}
    </li>
  );
}
