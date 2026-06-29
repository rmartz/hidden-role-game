import type { NightResolutionEvent } from "@/lib/game/modes/werewolf";
import { getPhaseLabel } from "@/lib/game/modes/werewolf";

import { NIGHT_OUTCOME_SUMMARY_ITEM_COPY } from "./NightOutcomeSummaryItem.copy";

interface NightOutcomeSummaryItemProps {
  playerName: string;
  events?: NightResolutionEvent[];
  roles: Record<string, { name: string }>;
  knighted?: boolean;
}

export function NightOutcomeSummaryItem({
  playerName,
  events,
  roles,
  knighted = false,
}: NightOutcomeSummaryItemProps) {
  const silenced = events?.some((event) => event.type === "silenced");
  const killedEvent = events?.find((event) => event.type === "killed");
  const toughGuyAbsorbed = events?.some(
    (event) => event.type === "tough-guy-absorbed",
  );
  const hangover = events?.some((event) => event.type === "hangover");

  return (
    <>
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
                : "ml-1 text-green-800 font-medium"
            }
          >
            {killedEvent.died ? "(killed)" : "(survived)"}
          </span>
        </>
      )}
      {toughGuyAbsorbed && (
        <span className="ml-1 text-orange-800 font-medium">
          (Tough Guy absorbed)
        </span>
      )}
      {silenced && (
        <span className="ml-1 text-yellow-800 font-medium">(silenced)</span>
      )}
      {hangover && (
        <span className="ml-1 text-amber-800 font-medium">
          {NIGHT_OUTCOME_SUMMARY_ITEM_COPY.hangover}
        </span>
      )}
      {knighted && (
        <span className="ml-1 text-blue-600 font-medium">(knighted)</span>
      )}
    </>
  );
}
