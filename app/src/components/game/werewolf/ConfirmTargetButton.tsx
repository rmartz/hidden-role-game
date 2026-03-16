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

interface Props {
  gameId: string;
  roleId?: PhaseKey;
  hasTarget: boolean;
  /** Whether the player has made an active decision (target or intentional skip). */
  hasDecided: boolean;
  isConfirmed: boolean;
  isGroupPhase?: boolean;
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
  allAgreed,
  witchContext,
}: Props) {
  const action = useGameAction(gameId);

  if (isConfirmed) {
    return (
      <p className="mt-3 text-sm text-green-600 font-medium">
        Action confirmed. Wait for the Narrator to continue.
      </p>
    );
  }

  // Group phases require all members to agree before confirming.
  const disabled =
    !hasDecided || action.isPending || (isGroupPhase && !allAgreed);
  const tooltip = !hasDecided
    ? "Make a selection first"
    : isGroupPhase && !allAgreed
      ? "All group members must agree on the same target"
      : undefined;
  const label = !hasDecided
    ? "Confirm"
    : hasTarget
      ? getConfirmLabel(roleId, witchContext)
      : "Skip";

  return (
    <div className="mt-3">
      <Tooltip>
        <TooltipTrigger>
          <span className="inline-block">
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
          </span>
        </TooltipTrigger>
        {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
      </Tooltip>
    </div>
  );
}
