import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface PlayerNightSummaryItemProps {
  playerName: string;
  killed: boolean;
  survived: boolean;
  silenced: boolean;
  smited: boolean;
}

export function PlayerNightSummaryItem({
  playerName,
  killed,
  survived,
  silenced,
  smited,
}: PlayerNightSummaryItemProps) {
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

  const effects = (
    [
      smited && WEREWOLF_COPY.smite.effect,
      killed && !smited && "eliminated",
      silenced && "silenced",
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
