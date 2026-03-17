"use client";

import { WerewolfAction, getConfirmLabel } from "@/lib/game-modes/werewolf";
import type { PhaseKey, WitchConfirmContext } from "@/lib/game-modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

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
}: ConfirmTargetButtonProps) {
  const action = useGameAction(gameId);

  if (isConfirmed) {
    return (
      <p className="mt-3 text-sm text-green-600 font-medium">
        {WEREWOLF_COPY.confirmButton.actionConfirmed}
      </p>
    );
  }

  // Group phases require all members to agree before confirming.
  const needsConsensus = !!(isGroupPhase && hasGroupMembers && !allAgreed);
  const disabled = !hasDecided || action.isPending || needsConsensus;
  const tooltip = !hasDecided
    ? WEREWOLF_COPY.confirmButton.makeSelection
    : needsConsensus
      ? WEREWOLF_COPY.confirmButton.groupConsensus
      : undefined;
  const label = !hasDecided
    ? WEREWOLF_COPY.confirmButton.confirm
    : hasTarget
      ? getConfirmLabel(roleId, witchContext)
      : WEREWOLF_COPY.confirmButton.skip;

  return (
    <div className="mt-3 max-w-sm mx-auto flex justify-end">
      <Tooltip>
        <TooltipTrigger render={<span />}>
          <Button
            onClick={() => {
              action.mutate({
                actionId: WerewolfAction.ConfirmNightTarget,
              });
            }}
            disabled={disabled}
          >
            {label}
          </Button>
        </TooltipTrigger>
        {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
      </Tooltip>
    </div>
  );
}
