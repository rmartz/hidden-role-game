import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

interface PlayerInvestigationResultProps {
  targetName: string;
  isWerewolfTeam: boolean;
  resultLabel?: string;
  secondTargetName?: string;
}

export function PlayerInvestigationResult({
  targetName,
  isWerewolfTeam,
  resultLabel,
  secondTargetName,
}: PlayerInvestigationResultProps) {
  const statusText = WEREWOLF_COPY.narrator.teamStatus(isWerewolfTeam);
  const displayLabel = resultLabel ?? statusText;

  return (
    <div className="mt-4 rounded-md border p-3 text-sm">
      <p className="font-medium">Investigation result:</p>
      <p className="mt-1">
        <strong className="text-foreground">{targetName}</strong>
        {secondTargetName ? (
          <>
            {" "}
            and <strong className="text-foreground">
              {secondTargetName}
            </strong>{" "}
            are <strong className="text-foreground">{displayLabel}</strong>.
          </>
        ) : (
          <>
            {" "}
            is <strong className="text-foreground">{displayLabel}</strong>.
          </>
        )}
      </p>
    </div>
  );
}
