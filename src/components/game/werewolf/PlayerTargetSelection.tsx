"use client";

import { WerewolfAction, WerewolfRole } from "@/lib/game/modes/werewolf";
import type { PhaseKey, TargetablePlayer } from "@/lib/game/modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import type { PublicLobbyPlayer } from "@/server/types";
import { ConfirmTargetButton } from "./ConfirmTargetButton";
import { WitchInformationPanel } from "./WitchInformationPanel";
import { GroupTargetSuggestion } from "./GroupTargetSuggestion";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

interface TeamVoteDisplay {
  playerName: string;
  targetName: string;
}

export interface PlayerTargetSelectionProps {
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
  myPlayerId?: string;
  previousNightTargetId?: string;
  mySecondNightTarget?: string;
  requiresSecondTarget?: boolean;
  mirrorcasterCharged?: boolean;
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
  myPlayerId,
  previousNightTargetId,
  mySecondNightTarget,
  requiresSecondTarget = false,
  mirrorcasterCharged,
}: PlayerTargetSelectionProps) {
  const action = useGameAction(gameId);
  const hasFirstMentalistTarget =
    myNightTarget !== null && myNightTarget !== undefined;
  const isMentalistSelectionComplete =
    hasFirstMentalistTarget && mySecondNightTarget !== undefined;

  const isWitchAbilityUsedOnly =
    confirmPhaseKey === WerewolfRole.Witch && witchAbilityUsed && !isConfirmed;

  const isWitchSelfDisabled =
    confirmPhaseKey === WerewolfRole.Witch &&
    myPlayerId !== undefined &&
    !(attackedPlayerIds ?? []).includes(myPlayerId);
  const shouldShowMentalistSecondTargetHeading =
    requiresSecondTarget &&
    hasFirstMentalistTarget &&
    mySecondNightTarget === undefined;

  const handleStandardTargetClick = (
    player: TargetablePlayer,
    isSelected: boolean,
  ) => {
    action.mutate({
      actionId: WerewolfAction.SetNightTarget,
      payload: {
        targetPlayerId: isSelected ? undefined : player.id,
      },
    });
  };

  const handleMentalistTargetClick = (player: TargetablePlayer) => {
    if (player.id === myNightTarget) {
      action.mutate({
        actionId: WerewolfAction.SetNightTarget,
        payload: {
          targetPlayerId: undefined,
        },
      });
      return;
    }

    if (player.id === mySecondNightTarget) {
      action.mutate({
        actionId: WerewolfAction.SetNightTarget,
        payload: {
          targetPlayerId: undefined,
          isSecondTarget: true,
        },
      });
      return;
    }

    if (myNightTarget === null || myNightTarget === undefined) {
      action.mutate({
        actionId: WerewolfAction.SetNightTarget,
        payload: {
          targetPlayerId: player.id,
        },
      });
      return;
    }

    if (mySecondNightTarget === undefined) {
      action.mutate({
        actionId: WerewolfAction.SetNightTarget,
        payload: {
          targetPlayerId: player.id,
          isSecondTarget: true,
        },
      });
    }
  };

  const handleTargetClick = (player: TargetablePlayer, isSelected: boolean) => {
    if (requiresSecondTarget) {
      handleMentalistTargetClick(player);
      return;
    }

    handleStandardTargetClick(player, isSelected);
  };

  return (
    <div>
      {isWitchAbilityUsedOnly ? (
        <WitchInformationPanel
          players={players}
          witchAbilityUsed={true}
          attackedPlayerIds={[]}
        />
      ) : (
        <>
          {confirmPhaseKey === WerewolfRole.Witch && !witchAbilityUsed && (
            <WitchInformationPanel
              players={players}
              witchAbilityUsed={false}
              attackedPlayerIds={attackedPlayerIds ?? []}
            />
          )}

          {confirmPhaseKey === WerewolfRole.Mirrorcaster && (
            <p className="mb-3 text-sm font-medium text-muted-foreground italic">
              {mirrorcasterCharged
                ? WEREWOLF_COPY.mirrorcaster.attackMode
                : WEREWOLF_COPY.mirrorcaster.protectMode}
            </p>
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
          {shouldShowMentalistSecondTargetHeading && (
            <h3 className="text-lg font-semibold mb-2 mt-4 text-center">
              {WEREWOLF_COPY.mentalist.chooseSecondTarget}
            </h3>
          )}
          {!(isConfirmed && myNightTarget === null) && (
            <div className="flex flex-col gap-2 max-w-sm mx-auto">
              {targets.map(([player, isSelected]) => (
                <Button
                  key={player.id}
                  variant={
                    isSelected || mySecondNightTarget === player.id
                      ? "default"
                      : "outline"
                  }
                  onClick={() => {
                    handleTargetClick(player, isSelected);
                  }}
                  disabled={
                    action.isPending ||
                    isConfirmed ||
                    player.id === previousNightTargetId ||
                    (isWitchSelfDisabled && player.id === myPlayerId) ||
                    (requiresSecondTarget &&
                      isMentalistSelectionComplete &&
                      player.id !== myNightTarget &&
                      player.id !== mySecondNightTarget)
                  }
                >
                  {player.name}
                  {(player.id === previousNightTargetId ||
                    (isWitchSelfDisabled && player.id === myPlayerId)) &&
                    " (unavailable)"}
                </Button>
              ))}
              {!isConfirmed && (
                <Button
                  variant={myNightTarget === null ? "default" : "outline"}
                  onClick={() => {
                    action.mutate({
                      actionId: WerewolfAction.SetNightTarget,
                      payload: {
                        targetPlayerId:
                          myNightTarget === null ? undefined : null,
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
            hasDecided={
              requiresSecondTarget
                ? myNightTarget === null ||
                  (myNightTarget !== undefined &&
                    mySecondNightTarget !== undefined)
                : isGroupPhase || myNightTarget !== undefined
            }
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
            mirrorcasterCharged={mirrorcasterCharged}
          />
        </>
      )}
    </div>
  );
}
