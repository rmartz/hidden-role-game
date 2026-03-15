"use client";

import { WerewolfAction } from "@/lib/game-modes/werewolf";
import type { TargetablePlayer } from "@/lib/game-modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import { ConfirmTargetButton } from "./ConfirmTargetButton";

interface TeamVoteDisplay {
  playerName: string;
  targetName: string;
}

interface Props {
  gameId: string;
  targets: readonly (readonly [TargetablePlayer, boolean])[];
  isConfirmed: boolean;
  isTeamPhase: boolean;
  confirmPhaseKey: string | undefined;
  hasTarget: boolean;
  allAgreed: boolean;
  teamVotes?: TeamVoteDisplay[];
  suggestedTargetId?: string;
  myNightTarget?: string;
}

export function PlayerTargetSelection({
  gameId,
  targets,
  isConfirmed,
  isTeamPhase,
  confirmPhaseKey,
  hasTarget,
  allAgreed,
  teamVotes = [],
  suggestedTargetId,
  myNightTarget,
}: Props) {
  const action = useGameAction(gameId);
  const hasTeammates = teamVotes.length > 0 || isTeamPhase;

  return (
    <div>
      {isTeamPhase && !isConfirmed && hasTeammates && (
        <div className="mb-3 rounded-md border p-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Teammate votes:
          </p>
          {teamVotes.length > 0 ? (
            <ul className="text-xs space-y-0.5">
              {teamVotes.map((vote, i) => (
                <li key={i}>
                  {vote.playerName} → {vote.targetName}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No votes yet.</p>
          )}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-2">
        {isConfirmed ? "Your target" : "Choose a target"}
      </h2>
      <div className="flex flex-col gap-2">
        {targets.map(([player, isSelected]) => (
          <Button
            key={player.id}
            variant={isSelected ? "default" : "outline"}
            onClick={() => {
              action.mutate({
                actionId: WerewolfAction.SetNightTarget,
                payload: {
                  targetPlayerId: isSelected ? undefined : player.id,
                },
              });
            }}
            disabled={action.isPending || isConfirmed}
            className="justify-start"
          >
            {player.name}
            {isSelected && " (selected)"}
          </Button>
        ))}
      </div>

      {isTeamPhase &&
        suggestedTargetId &&
        myNightTarget !== suggestedTargetId &&
        !isConfirmed && (
          <Button
            variant="secondary"
            className="mt-2"
            onClick={() => {
              action.mutate({
                actionId: WerewolfAction.SetNightTarget,
                payload: { targetPlayerId: suggestedTargetId },
              });
            }}
            disabled={action.isPending}
          >
            Approve suggested target
          </Button>
        )}

      <ConfirmTargetButton
        gameId={gameId}
        roleId={confirmPhaseKey}
        hasTarget={hasTarget}
        isConfirmed={isConfirmed}
        isTeamPhase={isTeamPhase}
        allAgreed={allAgreed}
      />
    </div>
  );
}
