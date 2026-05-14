import type {
  AttackNightResolutionEvent,
  AltruistInterceptedNightResolutionEvent,
  NightResolutionEvent,
  VeteranCounterkilledNightResolutionEvent,
} from "@/lib/game/modes/werewolf";
import { WerewolfRole } from "@/lib/game/modes/werewolf";
import { NightOutcomeSummaryItem } from "./NightOutcomeSummaryItem";
import { getPlayerName } from "@/lib/player";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import { groupBy } from "lodash";

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
  const veteranCounterkills = events.filter(
    (e): e is VeteranCounterkilledNightResolutionEvent =>
      e.type === "veteran-counterkilled",
  );
  const regularEvents = events.filter(
    (e) =>
      e.type !== "altruist-intercepted" && e.type !== "veteran-counterkilled",
  );
  // Suppress the generic killed row for a veteran-counter-killed player only
  // when the Veteran is the sole attacker. If the player was also attacked by
  // another source, keep the generic row so the narrator sees all the details.
  const veteranCounterkilledPlayerIds = new Set(
    veteranCounterkills
      .filter((e) => e.died)
      .filter((e) => {
        const killedEvent = regularEvents.find(
          (re): re is AttackNightResolutionEvent =>
            re.type === "killed" &&
            re.targetPlayerId === e.counterkilledPlayerId,
        );
        return killedEvent?.attackedBy.every(
          (a) => a === (WerewolfRole.Veteran as string),
        );
      })
      .map((e) => e.counterkilledPlayerId),
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
        {veteranCounterkills
          .filter((e) => e.died)
          .map((e) => {
            const veteranName =
              getPlayerName(players, e.veteranPlayerId) ?? "The Veteran";
            const counterkilledName =
              getPlayerName(players, e.counterkilledPlayerId) ?? "a player";
            const message =
              e.source === "wolf-repel"
                ? WEREWOLF_COPY.veteran.dayAnnouncementWolfRepel(
                    veteranName,
                    counterkilledName,
                  )
                : WEREWOLF_COPY.veteran.dayAnnouncementVisitorKilled(
                    veteranName,
                    counterkilledName,
                  );
            return (
              <li
                key={`${e.veteranPlayerId}-${e.counterkilledPlayerId}`}
                className="font-medium text-orange-600"
              >
                {message}
              </li>
            );
          })}
        {targetPlayerIds
          .filter(
            (targetPlayerId) =>
              !veteranCounterkilledPlayerIds.has(targetPlayerId),
          )
          .map((targetPlayerId) => (
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
