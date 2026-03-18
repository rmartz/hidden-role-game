interface PlayerNightSummaryItemProps {
  playerName: string;
  killed: boolean;
  survived: boolean;
  silenced: boolean;
}

export function PlayerNightSummaryItem({
  playerName,
  killed,
  survived,
  silenced,
}: PlayerNightSummaryItemProps) {
  const effects = (
    [
      killed && "eliminated",
      survived && "attacked but survived",
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
