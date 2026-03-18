import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface PlayerNightSummaryItemProps {
  playerName: string;
  killed: boolean;
  silenced: boolean;
  smited: boolean;
}

export function PlayerNightSummaryItem({
  playerName,
  killed,
  silenced,
  smited,
}: PlayerNightSummaryItemProps) {
  const effectLabel = smited ? WEREWOLF_COPY.smite.effect : "eliminated";
  const effects = (
    [killed && effectLabel, silenced && "silenced"] as (string | false)[]
  )
    .filter(Boolean)
    .join(" and ");

  return (
    <li className="text-sm">
      {playerName} was {effects}.
    </li>
  );
}
