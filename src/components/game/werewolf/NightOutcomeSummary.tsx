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
      e.type !== "altruist-intercepted" &&
      e.type !== "veteran-counterkilled" &&
      e.type !== "swapper-swapped",
  );
  // For a veteran-counter-killed player who was killed solely by the Veteran,
  // strip the generic "killed" event from the row so the narrator sees the
  // special Veteran announcement instead of a duplicate. Non-kill events on
  // that same player (silenced, knighted, tough-guy-absorbed, etc.) are
  // preserved — the row is only omitted entirely when nothing else remains.
  const veteranOnlyKilledPlayerIds = new Set(
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
  // For Veteran-only-killed players, remove the "killed" event so the generic
  // row doesn't duplicate the Veteran announcement, but keep other events.
  const filteredEventsPerPlayer: Record<string, NightResolutionEvent[]> = {};
  for (const [playerId, playerEvents] of Object.entries(eventsPerPlayer)) {
    filteredEventsPerPlayer[playerId] = veteranOnlyKilledPlayerIds.has(playerId)
      ? playerEvents.filter((e) => e.type !== "killed")
      : playerEvents;
  }
  const targetPlayerIds = Object.keys(filteredEventsPerPlayer).filter(
    (playerId) =>
      (filteredEventsPerPlayer[playerId]?.length ?? 0) > 0 ||
      playerId === knightedPlayerId,
  );
  if (
    knightedPlayerId !== undefined &&
    filteredEventsPerPlayer[knightedPlayerId] === undefined
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
        {targetPlayerIds.map((targetPlayerId) => (
          <li key={targetPlayerId}>
            <NightOutcomeSummaryItem
              playerName={
                getPlayerName(players, targetPlayerId) ?? targetPlayerId
              }
              events={filteredEventsPerPlayer[targetPlayerId]}
              roles={roles}
              knighted={targetPlayerId === knightedPlayerId}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
