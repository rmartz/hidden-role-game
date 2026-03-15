interface PlayerInvestigationResultProps {
  targetName: string;
  isWerewolfTeam: boolean;
}

export function PlayerInvestigationResult({
  targetName,
  isWerewolfTeam,
}: PlayerInvestigationResultProps) {
  return (
    <div className="mt-4 rounded-md border p-3 text-sm">
      <p className="font-medium">Investigation result:</p>
      <p className="mt-1">
        <strong className="text-foreground">{targetName}</strong> is{" "}
        <strong className="text-foreground">
          {isWerewolfTeam ? "on the Werewolf team" : "not on the Werewolf team"}
        </strong>
        .
      </p>
    </div>
  );
}
