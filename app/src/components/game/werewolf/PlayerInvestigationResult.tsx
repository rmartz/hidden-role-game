import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface PlayerInvestigationResultProps {
  targetName: string;
  isWerewolfTeam: boolean;
}

export function PlayerInvestigationResult({
  targetName,
  isWerewolfTeam,
}: PlayerInvestigationResultProps) {
  const statusText = WEREWOLF_COPY.narrator.teamStatus(isWerewolfTeam);

  return (
    <div className="mt-4 rounded-md border p-3 text-sm">
      <p className="font-medium">Investigation result:</p>
      <p className="mt-1">
        <strong className="text-foreground">{targetName}</strong> is{" "}
        <strong className="text-foreground">{statusText}</strong>.
      </p>
    </div>
  );
}
