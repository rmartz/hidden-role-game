"use client";

import { WerewolfAction, WerewolfRole } from "@/lib/game-modes/werewolf";
import type { PhaseKey, TargetablePlayer } from "@/lib/game-modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import type { PublicLobbyPlayer } from "@/server/types";
import { ConfirmTargetButton } from "./ConfirmTargetButton";
import { WitchInformationPanel } from "./WitchInformationPanel";

interface TeamVoteDisplay {
  playerName: string;
  targetName: string;
}

interface Props {
  gameId: string;
  players: PublicLobbyPlayer[];
  targets: readonly (readonly [TargetablePlayer, boolean])[];
  isConfirmed: boolean;
  isGroupPhase: boolean;
  confirmPhaseKey?: PhaseKey;
  hasTarget: boolean;
  allAgreed: boolean;
  hasVisibleTeammates?: boolean;
  teamVotes?: TeamVoteDisplay[];
  suggestedTargetId?: string;
  myNightTarget?: string | null;
  witchAbilityUsed?: boolean;
  attackedPlayerIds?: string[];
  previousNightTargetId?: string;
}

export function PlayerTargetSelection({
  gameId,
  players,
  targets,
  isConfirmed,
  isGroupPhase,
  confirmPhaseKey,
  hasTarget,
  allAgreed,
  hasVisibleTeammates = false,
  teamVotes = [],
  suggestedTargetId,
  myNightTarget,
  witchAbilityUsed,
  attackedPlayerIds,
  previousNightTargetId,
}: Props) {
  const action = useGameAction(gameId);

  if (
    confirmPhaseKey === WerewolfRole.Witch &&
    witchAbilityUsed &&
    !isConfirmed
  ) {
    return (
      <div>
        <WitchInformationPanel
          players={players}
          witchAbilityUsed={true}
          attackedPlayerIds={[]}
        />
      </div>
    );
  }

  return (
    <div>
      {confirmPhaseKey === WerewolfRole.Witch && !witchAbilityUsed && (
        <WitchInformationPanel
          players={players}
          witchAbilityUsed={false}
          attackedPlayerIds={attackedPlayerIds ?? []}
        />
      )}

      {isGroupPhase && !isConfirmed && hasVisibleTeammates && (
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
        {isConfirmed && myNightTarget === null
          ? "You did not perform an action this turn"
          : isConfirmed
            ? "Your target"
            : "Choose a target"}
      </h2>
      {!(isConfirmed && myNightTarget === null) && (
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
              disabled={
                action.isPending ||
                isConfirmed ||
                player.id === previousNightTargetId
              }
              className="justify-start"
            >
              {player.name}
              {isSelected && " (selected)"}
              {player.id === previousNightTargetId && " (unavailable)"}
            </Button>
          ))}
          {!isConfirmed && (
            <Button
              variant={myNightTarget === null ? "default" : "outline"}
              onClick={() => {
                action.mutate({
                  actionId: WerewolfAction.SetNightTarget,
                  payload: {
                    targetPlayerId: myNightTarget === null ? undefined : null,
                  },
                });
              }}
              disabled={action.isPending}
              className="justify-start"
            >
              No target
              {myNightTarget === null && " (selected)"}
            </Button>
          )}
        </div>
      )}

      {isGroupPhase &&
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
        hasDecided={isGroupPhase || myNightTarget !== undefined}
        isConfirmed={isConfirmed}
        isGroupPhase={isGroupPhase}
        allAgreed={allAgreed}
        witchContext={
          confirmPhaseKey === WerewolfRole.Witch
            ? {
                selectedTargetId: myNightTarget ?? undefined,
                attackedPlayerIds: attackedPlayerIds ?? [],
              }
            : undefined
        }
      />
    </div>
  );
}
