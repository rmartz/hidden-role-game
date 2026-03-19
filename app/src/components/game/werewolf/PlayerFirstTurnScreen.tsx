"use client";

import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface PlayerFirstTurnScreenProps {
  roleName?: string;
  teammateNames: string[];
  villagerNames?: string[];
}

export function PlayerFirstTurnScreen({
  roleName,
  teammateNames,
  villagerNames,
}: PlayerFirstTurnScreenProps) {
  const hasTeammates = teammateNames.length > 0;
  const teammateLabel = teammateNames.length === 1 ? "teammate" : "teammates";

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">It&apos;s Your Turn</h1>
      <p className="text-muted-foreground mb-4">
        <strong className="text-foreground">{roleName}</strong> —{" "}
        {hasTeammates
          ? `awake, find your ${teammateLabel} and make yourself known to the Narrator.`
          : "awake and make yourself known to the Narrator."}
      </p>
      {villagerNames !== undefined && (
        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium mb-1">
            {WEREWOLF_COPY.elusiveSeer.villagerListHeading}
          </p>
          {villagerNames.length === 0 ? (
            <p className="text-muted-foreground italic">
              {WEREWOLF_COPY.elusiveSeer.noVillagers}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {villagerNames.map((name) => (
                <li key={name} className="text-foreground">
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
