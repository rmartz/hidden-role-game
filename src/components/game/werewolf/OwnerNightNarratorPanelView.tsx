"use client";

import { Button } from "@/components/ui/button";
import type {
  InvestigationResultForNarrator,
  NarratorInstruction,
  TargetablePlayer,
} from "@/lib/game/modes/werewolf";
import { isRoleActive } from "@/lib/game/modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import type { VisibleTeammate } from "@/server/types";

import { NarratorNightInstruction } from "./NarratorNightInstruction";
import type { ResolvedVote } from "./OwnerGameNightScreen-derive";
import { OwnerIlluminatiRevealPanel } from "./OwnerIlluminatiRevealPanel";
import { OwnerInvestigationConfirm } from "./OwnerInvestigationConfirm";
import { OwnerNightTargetPanel } from "./OwnerNightTargetPanel";
import { VeteranActionPanelView } from "./VeteranActionPanelView";

export interface OwnerNightNarratorPanelViewProps {
  gameId: string;
  activePhaseKey: string;
  activePhaseLabel: string;
  activePlayerNames: string[];
  isFirstTurn: boolean;
  narratorInstruction?: NarratorInstruction;
  mercenaryCharged?: boolean;
  mirrorcasterCharged?: boolean;
  isWitchAbilitySkipped: boolean;
  activeTargetConfirmed: boolean;
  abilityBypass: boolean;
  onRestoreWitchAbility: () => void;
  onBypassWitchAbility: () => void;
  isVeteranPhase: boolean;
  veteranAlertsUsed: number;
  isVeteranAlerted: boolean;
  veteranHasDecided: boolean;
  isActionConfirmed: boolean;
  onVeteranAlert: () => void;
  onVeteranSkip: () => void;
  onVeteranConfirm: () => void;
  isEvilEmpathPhase: boolean;
  hasGroupAction: boolean;
  groupMemberCount: number;
  resolvedVotes: ResolvedVote[];
  activeTargetName?: string;
  targetablePlayers: TargetablePlayer[];
  activeTarget?: string;
  onTargetClick: (
    playerId: string | null | undefined,
    isSecondTarget?: boolean,
  ) => void;
  previousTargetId?: string;
  requiresDualTarget: boolean;
  secondTargetId?: string;
  dualTargetPrompt?: string;
  investigationResult?: InvestigationResultForNarrator;
  isResultRevealed: boolean;
  isIlluminatiPhase: boolean;
  illuminatiPlayers: { id: string; name: string }[];
  illuminatiRoleAssignments: VisibleTeammate[];
  isIlluminatiRevealed: boolean;
  exposerRevealText?: string;
  evilEmpathNightResult?: boolean;
  isPending: boolean;
}

export function OwnerNightNarratorPanelView({
  gameId,
  activePhaseKey,
  activePhaseLabel,
  activePlayerNames,
  isFirstTurn,
  narratorInstruction,
  mercenaryCharged,
  mirrorcasterCharged,
  isWitchAbilitySkipped,
  activeTargetConfirmed,
  abilityBypass,
  onRestoreWitchAbility,
  onBypassWitchAbility,
  isVeteranPhase,
  veteranAlertsUsed,
  isVeteranAlerted,
  veteranHasDecided,
  isActionConfirmed,
  onVeteranAlert,
  onVeteranSkip,
  onVeteranConfirm,
  isEvilEmpathPhase,
  hasGroupAction,
  groupMemberCount,
  resolvedVotes,
  activeTargetName,
  targetablePlayers,
  activeTarget,
  onTargetClick,
  previousTargetId,
  requiresDualTarget,
  secondTargetId,
  dualTargetPrompt,
  investigationResult,
  isResultRevealed,
  isIlluminatiPhase,
  illuminatiPlayers,
  illuminatiRoleAssignments,
  isIlluminatiRevealed,
  exposerRevealText,
  evilEmpathNightResult,
  isPending,
}: OwnerNightNarratorPanelViewProps) {
  return (
    <>
      <p className="mb-4 text-muted-foreground">
        {WEREWOLF_COPY.narrator.currentlyAwake}{" "}
        <strong className="text-foreground">{activePhaseLabel}</strong>
        {activePlayerNames.length > 0 && (
          <span> ({activePlayerNames.join(", ")})</span>
        )}
      </p>
      {isFirstTurn && narratorInstruction && (
        <NarratorNightInstruction instruction={narratorInstruction} />
      )}
      {isRoleActive(activePhaseKey, WerewolfRole.Mercenary) && (
        <p className="mb-3 text-sm text-muted-foreground italic">
          {mercenaryCharged
            ? WEREWOLF_COPY.mercenary.narratorBribeMode
            : WEREWOLF_COPY.mercenary.narratorProtectMode}
        </p>
      )}
      {isRoleActive(activePhaseKey, WerewolfRole.Mirrorcaster) && (
        <p className="mb-3 text-sm text-muted-foreground italic">
          {mirrorcasterCharged
            ? WEREWOLF_COPY.mirrorcaster.narratorAttackMode
            : WEREWOLF_COPY.mirrorcaster.narratorProtectMode}
        </p>
      )}
      {!isFirstTurn && (
        <>
          {isWitchAbilitySkipped && !activeTargetConfirmed && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground italic mb-2">
                {WEREWOLF_COPY.night.witchAbilityUsed}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRestoreWitchAbility}
                  disabled={isPending}
                >
                  {WEREWOLF_COPY.narrator.restoreAbility}
                </Button>
                {!abilityBypass && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBypassWitchAbility}
                  >
                    {WEREWOLF_COPY.narrator.bypassAbility}
                  </Button>
                )}
              </div>
            </div>
          )}
          {isVeteranPhase ? (
            <VeteranActionPanelView
              alertsUsed={veteranAlertsUsed}
              isAlerted={isVeteranAlerted}
              hasDecided={veteranHasDecided}
              isConfirmed={isActionConfirmed}
              isPending={isPending}
              onAlert={onVeteranAlert}
              onSkip={onVeteranSkip}
              onConfirm={onVeteranConfirm}
            />
          ) : (
            (!isWitchAbilitySkipped || abilityBypass) &&
            !isEvilEmpathPhase && (
              <OwnerNightTargetPanel
                groupAction={hasGroupAction}
                groupMemberCount={groupMemberCount}
                resolvedVotes={resolvedVotes}
                activeTargetName={activeTargetName}
                activeTargetConfirmed={activeTargetConfirmed}
                targetablePlayers={targetablePlayers}
                activeTarget={activeTarget}
                onTargetClick={onTargetClick}
                isPending={isPending}
                previousTargetId={previousTargetId}
                requiresDualTarget={requiresDualTarget}
                secondTarget={secondTargetId}
                dualTargetPrompt={dualTargetPrompt}
              />
            )
          )}
        </>
      )}
      {investigationResult && (
        <OwnerInvestigationConfirm
          gameId={gameId}
          targetName={investigationResult.targetName}
          isWerewolfTeam={investigationResult.isWerewolfTeam}
          isResultRevealed={isResultRevealed}
          resultLabel={investigationResult.resultLabel}
          secondTargetName={investigationResult.secondTargetName}
          illusionFlipLabel={investigationResult.illusionFlipLabel}
        />
      )}
      {isIlluminatiPhase && (
        <OwnerIlluminatiRevealPanel
          gameId={gameId}
          players={illuminatiPlayers}
          roleAssignments={illuminatiRoleAssignments}
          isRevealed={isIlluminatiRevealed}
        />
      )}
      {exposerRevealText && (
        <p className="mt-2 text-xs text-muted-foreground italic">
          {exposerRevealText}
        </p>
      )}
      {evilEmpathNightResult !== undefined && (
        <p className="mt-2 text-sm font-medium">
          {evilEmpathNightResult
            ? WEREWOLF_COPY.evilEmpath.adjacentResult
            : WEREWOLF_COPY.evilEmpath.notAdjacentResult}
        </p>
      )}
    </>
  );
}
