"use client";

import { WerewolfAction } from "@/lib/game/modes/werewolf";
import type { PhaseKey, WitchConfirmContext } from "@/lib/game/modes/werewolf";
import { useGameAction } from "@/hooks";
import { ConfirmTargetButtonView } from "./ConfirmTargetButtonView";

interface ConfirmTargetButtonProps {
  gameId: string;
  roleId?: PhaseKey;
  hasTarget: boolean;
  /** Whether the player has made an active decision (target or intentional skip). */
  hasDecided: boolean;
  isConfirmed: boolean;
  isGroupPhase?: boolean;
  hasGroupMembers?: boolean;
  allAgreed?: boolean;
  witchContext?: WitchConfirmContext;
  mirrorcasterCharged?: boolean;
  mercenaryCharged?: boolean;
}

export function ConfirmTargetButton({
  gameId,
  roleId,
  hasTarget,
  hasDecided,
  isConfirmed,
  isGroupPhase,
  hasGroupMembers,
  allAgreed,
  witchContext,
  mirrorcasterCharged,
  mercenaryCharged,
}: ConfirmTargetButtonProps) {
  const action = useGameAction(gameId);

  return (
    <ConfirmTargetButtonView
      roleId={roleId}
      hasTarget={hasTarget}
      hasDecided={hasDecided}
      isConfirmed={isConfirmed}
      isGroupPhase={isGroupPhase}
      hasGroupMembers={hasGroupMembers}
      allAgreed={allAgreed}
      witchContext={witchContext}
      mirrorcasterCharged={mirrorcasterCharged}
      mercenaryCharged={mercenaryCharged}
      isPending={action.isPending}
      onConfirm={() => {
        action.mutate({ actionId: WerewolfAction.ConfirmNightTarget });
      }}
    />
  );
}
