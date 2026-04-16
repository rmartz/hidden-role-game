"use client";

import { WerewolfAction, WerewolfRole } from "@/lib/game/modes/werewolf";
import type { PhaseKey, TargetablePlayer } from "@/lib/game/modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import type { PublicLobbyPlayer } from "@/server/types";
import { ConfirmTargetButtonView } from "./ConfirmTargetButtonView";
import { WitchInformationPanel } from "./WitchInformationPanel";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import { getPlayerName } from "@/lib/player";

interface TeamVoteDisplay {
  playerName: string;
  targetName: string;
}

export interface PlayerTargetSelectionViewProps {
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
  isPending: boolean;
  onMutate: (params: { actionId: string; payload?: unknown }) => void;
  onConfirm: () => void;
}

export interface PlayerTargetSelectionProps extends Omit<
  PlayerTargetSelectionViewProps,
  "isPending" | "onMutate" | "onConfirm"
> {
  gameId: string;
}

export function PlayerTargetSelectionView({
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
  isPending,
  onMutate,
  onConfirm,
}: PlayerTargetSelectionViewProps) {
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
  const hasSecondMentalistTarget = mySecondNightTarget !== undefined;
  const shouldShowMentalistSecondTargetHeading =
    requiresSecondTarget &&
    hasFirstMentalistTarget !== hasSecondMentalistTarget;

  const handleTargetClick = (player: TargetablePlayer, isSelected: boolean) => {
    if (requiresSecondTarget) {
      if (player.id === myNightTarget) {
        onMutate({
          actionId: WerewolfAction.SetNightTarget,
          payload: { targetPlayerId: undefined },
        });
        return;
      }

      if (player.id === mySecondNightTarget) {
        onMutate({
          actionId: WerewolfAction.SetNightTarget,
          payload: { targetPlayerId: undefined, isSecondTarget: true },
        });
        return;
      }

      if (!hasFirstMentalistTarget) {
        onMutate({
          actionId: WerewolfAction.SetNightTarget,
          payload: { targetPlayerId: player.id },
        });
        return;
      }

      if (mySecondNightTarget === undefined) {
        onMutate({
          actionId: WerewolfAction.SetNightTarget,
          payload: { targetPlayerId: player.id, isSecondTarget: true },
        });
      }
      return;
    }

    onMutate({
      actionId: WerewolfAction.SetNightTarget,
      payload: { targetPlayerId: isSelected ? undefined : player.id },
    });
  };

  const suggestedName = suggestedTargetId
    ? (getPlayerName(players, suggestedTargetId) ?? suggestedTargetId)
    : undefined;

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
              {suggestedTargetId && suggestedName && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs mb-1.5">
                    {WEREWOLF_COPY.targetSelection.suggestedTarget(
                      suggestedName,
                    )}
                  </p>
                  {myNightTarget !== suggestedTargetId && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onMutate({
                          actionId: WerewolfAction.SetNightTarget,
                          payload: { targetPlayerId: suggestedTargetId },
                        });
                      }}
                      disabled={isPending}
                    >
                      {WEREWOLF_COPY.targetSelection.approveTarget}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <h2 className="text-lg font-semibold mb-2 text-center">
            {isConfirmed && myNightTarget === null
              ? WEREWOLF_COPY.targetSelection.noAction
              : isConfirmed
                ? WEREWOLF_COPY.targetSelection.yourTarget
                : shouldShowMentalistSecondTargetHeading
                  ? WEREWOLF_COPY.mentalist.chooseSecondTarget
                  : WEREWOLF_COPY.targetSelection.chooseTarget}
          </h2>
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
                    isPending ||
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
                    onMutate({
                      actionId: WerewolfAction.SetNightTarget,
                      payload: {
                        targetPlayerId:
                          myNightTarget === null ? undefined : null,
                      },
                    });
                  }}
                  disabled={isPending}
                >
                  {myNightTarget === null
                    ? WEREWOLF_COPY.targetSelection.noTarget_selected
                    : WEREWOLF_COPY.targetSelection.noTarget}
                </Button>
              )}
            </div>
          )}

          <ConfirmTargetButtonView
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
            isPending={isPending}
            onConfirm={onConfirm}
          />
        </>
      )}
    </div>
  );
}

export function PlayerTargetSelection({
  gameId,
  ...props
}: PlayerTargetSelectionProps) {
  const action = useGameAction(gameId);
  return (
    <PlayerTargetSelectionView
      {...props}
      isPending={action.isPending}
      onMutate={action.mutate}
      onConfirm={() => {
        action.mutate({ actionId: WerewolfAction.ConfirmNightTarget });
      }}
    />
  );
}
