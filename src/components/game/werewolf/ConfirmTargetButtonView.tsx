"use client";

import type { PhaseKey, WitchConfirmContext } from "@/lib/game-modes/werewolf";
import { getConfirmLabel } from "@/lib/game-modes/werewolf";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

export interface ConfirmTargetButtonViewProps {
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
  isPending?: boolean;
  onConfirm: () => void;
}

export function ConfirmTargetButtonView({
  roleId,
  hasTarget,
  hasDecided,
  isConfirmed,
  isGroupPhase,
  hasGroupMembers,
  allAgreed,
  witchContext,
  mirrorcasterCharged,
  isPending,
  onConfirm,
}: ConfirmTargetButtonViewProps) {
  const needsConsensus = !!(isGroupPhase && hasGroupMembers && !allAgreed);
  const disabled = !hasDecided || !!isPending || needsConsensus;
  const tooltip = !hasDecided
    ? WEREWOLF_COPY.confirmButton.makeSelection
    : needsConsensus
      ? WEREWOLF_COPY.confirmButton.groupConsensus
      : undefined;
  const label = !hasDecided
    ? WEREWOLF_COPY.confirmButton.confirm
    : hasTarget
      ? getConfirmLabel(roleId, witchContext, mirrorcasterCharged)
      : WEREWOLF_COPY.confirmButton.skip;

  return isConfirmed ? (
    <p className="mt-3 text-sm text-green-600 font-medium">
      {WEREWOLF_COPY.confirmButton.actionConfirmed}
    </p>
  ) : (
    <div className="mt-3 max-w-sm mx-auto flex justify-end">
      <Tooltip>
        <TooltipTrigger render={<span />}>
          <Button onClick={onConfirm} disabled={disabled}>
            {label}
          </Button>
        </TooltipTrigger>
        {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
      </Tooltip>
    </div>
  );
}
