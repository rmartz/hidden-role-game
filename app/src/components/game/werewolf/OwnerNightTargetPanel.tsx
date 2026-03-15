"use client";

import { Button } from "@/components/ui/button";
import type { TargetablePlayer } from "@/lib/game-modes/werewolf";

interface ResolvedVote {
  key: string;
  voterName: string;
  targetName: string;
}

interface Props {
  teamAction: boolean;
  resolvedVotes: ResolvedVote[];
  activeTargetName: string | undefined;
  activeTargetConfirmed: boolean;
  targetablePlayers: TargetablePlayer[];
  activeTarget: string | undefined;
  onTargetClick: (playerId: string) => void;
  isPending: boolean;
}

export function OwnerNightTargetPanel({
  teamAction,
  resolvedVotes,
  activeTargetName,
  activeTargetConfirmed,
  targetablePlayers,
  activeTarget,
  onTargetClick,
  isPending,
}: Props) {
  return (
    <div className="mb-4 rounded-md border p-3">
      {teamAction && (
        <div className="mb-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Votes:
          </p>
          {resolvedVotes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No votes yet</p>
          ) : (
            <ul className="text-xs space-y-0.5">
              {resolvedVotes.map((vote) => (
                <li key={vote.key}>
                  {vote.voterName} → {vote.targetName}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="text-sm font-medium mb-2">
        {teamAction ? "Suggested target: " : "Target: "}
        {activeTargetName ? (
          <>
            <strong className="text-foreground">{activeTargetName}</strong>
            {activeTargetConfirmed && (
              <span className="ml-1 text-xs text-green-600">(confirmed)</span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground italic">none</span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {targetablePlayers.map((player) => (
          <Button
            key={player.id}
            size="sm"
            variant={activeTarget === player.id ? "default" : "outline"}
            onClick={() => {
              onTargetClick(player.id);
            }}
            disabled={isPending}
          >
            {player.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
