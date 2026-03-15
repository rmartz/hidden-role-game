"use client";

interface Props {
  roleName: string | undefined;
  teammateNames: string[];
}

export function PlayerFirstTurnScreen({ roleName, teammateNames }: Props) {
  const hasTeammates = teammateNames.length > 0;
  const teammateLabel = teammateNames.length === 1 ? "teammate" : "teammates";

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-2">It&apos;s Your Turn</h1>
      <p className="text-muted-foreground mb-4">
        <strong className="text-foreground">{roleName}</strong> —{" "}
        {hasTeammates
          ? `awake, find your ${teammateLabel} and make yourself known to the Narrator.`
          : "awake and make yourself known to the Narrator."}
      </p>
    </div>
  );
}
