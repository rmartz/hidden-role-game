interface PlayerNightSummaryItemProps {
  playerName: string;
  killed: boolean;
  silenced: boolean;
}

export function PlayerNightSummaryItem({
  playerName,
  killed,
  silenced,
}: PlayerNightSummaryItemProps) {
  const effects = (
    [killed && "eliminated", silenced && "silenced"] as (string | false)[]
  )
    .filter(Boolean)
    .join(" and ");

  return (
    <li className="text-sm">
      {playerName} was {effects}.
    </li>
  );
}
