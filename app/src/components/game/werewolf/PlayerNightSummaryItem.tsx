import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface PlayerNightSummaryItemProps {
  playerName: string;
  killed: boolean;
  survived: boolean;
  silenced: boolean;
  hypnotized: boolean;
  smited: boolean;
  peaceful: boolean;
  isMe: boolean;
}

export function PlayerNightSummaryItem({
  playerName,
  killed,
  survived,
  silenced,
  hypnotized,
  smited,
  peaceful,
  isMe,
}: PlayerNightSummaryItemProps) {
  // Personal messages for silenced/hypnotized player (only visible to themselves).
  if (isMe && silenced) {
    return (
      <li className="text-sm font-medium text-amber-600">
        {WEREWOLF_COPY.silence.nightSummary}
      </li>
    );
  }

  if (isMe && hypnotized) {
    return (
      <li className="text-sm font-medium text-amber-600">
        {WEREWOLF_COPY.hypnotize.nightSummary}
      </li>
    );
  }

  // The "survived" effect is only visible to the Tough Guy themselves,
  // so use a personalized second-person message.
  if (survived) {
    const suffix = silenced ? " You have also been silenced." : "";
    return (
      <li className="text-sm font-medium text-orange-600">
        {WEREWOLF_COPY.day.toughGuySurvived}
        {suffix}
      </li>
    );
  }

  if (peaceful) {
    return (
      <li className="text-sm">
        {WEREWOLF_COPY.oldMan.peacefulDeath(playerName)}
      </li>
    );
  }

  const effects = (
    [
      smited && WEREWOLF_COPY.smite.effect,
      killed && !smited && "eliminated",
      silenced && "silenced",
      hypnotized && "hypnotized",
    ] as (string | false)[]
  )
    .filter(Boolean)
    .join(" and ");

  return (
    <li className="text-sm">
      {playerName} was {effects}.
    </li>
  );
}
