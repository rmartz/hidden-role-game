"use client";

import { WerewolfAction, WerewolfRole } from "@/lib/game-modes/werewolf";
import type { PhaseKey, TargetablePlayer } from "@/lib/game-modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import type { PublicLobbyPlayer } from "@/server/types";
import { ConfirmTargetButton } from "./ConfirmTargetButton";
import { WitchInformationPanel } from "./WitchInformationPanel";
import { GroupTargetSuggestion } from "./GroupTargetSuggestion";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

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
          {suggestedTargetId && (
            <GroupTargetSuggestion
              gameId={gameId}
              players={players}
              suggestedTargetId={suggestedTargetId}
              myNightTarget={myNightTarget}
              isConfirmed={isConfirmed}
            />
          )}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-2 text-center">
        {isConfirmed && myNightTarget === null
          ? WEREWOLF_COPY.targetSelection.noAction
          : isConfirmed
            ? WEREWOLF_COPY.targetSelection.yourTarget
            : WEREWOLF_COPY.targetSelection.chooseTarget}
      </h2>
      {!(isConfirmed && myNightTarget === null) && (
        <div className="flex flex-col gap-2 max-w-sm mx-auto">
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
            >
              {player.name}
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
            >
              {myNightTarget === null
                ? WEREWOLF_COPY.targetSelection.noTarget_selected
                : WEREWOLF_COPY.targetSelection.noTarget}
            </Button>
          )}
        </div>
      )}

      <ConfirmTargetButton
        gameId={gameId}
        roleId={confirmPhaseKey}
        hasTarget={hasTarget}
        hasDecided={isGroupPhase || myNightTarget !== undefined}
        isConfirmed={isConfirmed}
        isGroupPhase={isGroupPhase}
        hasGroupMembers={hasVisibleTeammates}
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
