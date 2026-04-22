"use client";

import { WerewolfAction } from "@/lib/game/modes/werewolf";
import { Button } from "@/components/ui/button";
import { useGameAction } from "@/hooks";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import type { VisibleTeammate } from "@/server/types";
import { getPlayerName } from "@/lib/player";

interface OwnerIlluminatiRevealPanelProps {
  gameId: string;
  players: { id: string; name: string }[];
  roleAssignments: VisibleTeammate[];
  isRevealed: boolean;
}

export function OwnerIlluminatiRevealPanel({
  gameId,
  players,
  roleAssignments,
  isRevealed,
}: OwnerIlluminatiRevealPanelProps) {
  const action = useGameAction(gameId);

  const roleRows = roleAssignments
    .filter((a) => a.role)
    .map((a) => ({
      playerName: getPlayerName(players, a.player.id) ?? a.player.id,
      roleName: a.role?.name ?? a.role?.id ?? "Unknown",
    }));

  return (
    <div className="mt-3 rounded-md border p-3 text-sm">
      <p className="font-medium mb-2">
        {WEREWOLF_COPY.illuminati.narratorRevealHeading}
      </p>
      <ul className="mb-3 space-y-0.5">
        {roleRows.map(({ playerName, roleName }) => (
          <li key={playerName} className="text-foreground">
            <strong>{playerName}</strong>: {roleName}
          </li>
        ))}
      </ul>
      {isRevealed ? (
        <p className="text-xs text-muted-foreground">
          {WEREWOLF_COPY.narrator.investigationResultRevealed}
        </p>
      ) : (
        <Button
          size="sm"
          variant="default"
          onClick={() => {
            action.mutate({
              actionId: WerewolfAction.RevealInvestigationResult,
            });
          }}
          disabled={action.isPending}
        >
          {WEREWOLF_COPY.narrator.revealToPlayer}
        </Button>
      )}
    </div>
  );
}
