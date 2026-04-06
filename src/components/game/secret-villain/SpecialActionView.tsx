"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";
import { getSvThemeLabels } from "@/lib/game-modes/secret-villain/themes";
import type { SvTheme } from "@/lib/game-modes/secret-villain/themes";
import { SpecialActionType } from "@/lib/game-modes/secret-villain/types";

import { InvestigationConsentView } from "./InvestigationConsentView";
import { PlayerSelectionView } from "./PlayerSelectionView";
import { PolicyPeekView } from "./PolicyPeekView";

interface SpecialActionViewProps {
  actionType: SpecialActionType;
  isPresident: boolean;
  presidentName: string;
  players: { id: string; name: string }[];
  selectedPlayerId?: string;
  onSelectPlayer: (playerId: string) => void;
  onConfirm: () => void;
  /** Acknowledge result and advance to next election. */
  onResolve?: () => void;
  isPending?: boolean;
  investigationResult?: { targetPlayerId: string; team: string };
  /** Player ID the president is waiting on for investigation consent. */
  investigationWaitingForPlayerId?: string;
  investigationConsent?: boolean;
  onConsent?: () => void;
  /** Trigger the peek action to reveal cards. */
  onPeek?: () => void;
  peekedCards?: string[];
  svTheme?: SvTheme;
}

interface ActionConfig {
  heading: string;
  instructions: string;
  confirm: string;
}

const STATIC_ACTION_CONFIG: Record<
  Exclude<SpecialActionType, SpecialActionType.Shoot>,
  ActionConfig
> = {
  [SpecialActionType.InvestigateTeam]: {
    heading: SECRET_VILLAIN_COPY.specialAction.investigateHeading,
    instructions: SECRET_VILLAIN_COPY.specialAction.investigateInstructions,
    confirm: SECRET_VILLAIN_COPY.specialAction.investigateConfirm,
  },
  [SpecialActionType.SpecialElection]: {
    heading: SECRET_VILLAIN_COPY.specialAction.specialElectionHeading,
    instructions: SECRET_VILLAIN_COPY.specialAction.specialElectionInstructions,
    confirm: SECRET_VILLAIN_COPY.specialAction.specialElectionConfirm,
  },
  [SpecialActionType.PolicyPeek]: {
    heading: SECRET_VILLAIN_COPY.specialAction.policyPeekHeading,
    instructions: SECRET_VILLAIN_COPY.specialAction.policyPeekInstructions,
    confirm: SECRET_VILLAIN_COPY.specialAction.policyPeekConfirm,
  },
};

function getActionConfig(
  actionType: SpecialActionType,
  svTheme?: SvTheme,
): ActionConfig {
  if (actionType === SpecialActionType.Shoot) {
    const themeLabels = getSvThemeLabels(svTheme);
    return {
      heading: themeLabels.shootHeading,
      instructions: themeLabels.shootInstruction,
      confirm: themeLabels.shootConfirm,
    };
  }
  return STATIC_ACTION_CONFIG[actionType];
}

export function SpecialActionView({
  actionType,
  isPresident,
  presidentName,
  players,
  selectedPlayerId,
  onSelectPlayer,
  onConfirm,
  onResolve,
  isPending,
  investigationResult,
  investigationWaitingForPlayerId,
  investigationConsent,
  onConsent,
  onPeek,
  peekedCards,
  svTheme,
}: SpecialActionViewProps) {
  const config = getActionConfig(actionType, svTheme);

  if (!isPresident) {
    if (
      actionType === SpecialActionType.InvestigateTeam &&
      investigationConsent &&
      onConsent
    ) {
      return (
        <InvestigationConsentView
          presidentName={presidentName}
          onConsent={onConsent}
          isPending={isPending}
        />
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{SECRET_VILLAIN_COPY.specialAction.heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {SECRET_VILLAIN_COPY.policy.waitingForPresident(presidentName)}
          </p>
        </CardContent>
      </Card>
    );
  }

  // President: investigation result — show result with "Done" button.
  if (investigationResult) {
    const targetPlayer = players.find(
      (p) => p.id === investigationResult.targetPlayerId,
    );
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config.heading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium">
            {SECRET_VILLAIN_COPY.specialAction.investigateResult(
              targetPlayer?.name ?? investigationResult.targetPlayerId,
              investigationResult.team,
            )}
          </p>
          {onResolve && (
            <Button onClick={onResolve} disabled={!!isPending}>
              {SECRET_VILLAIN_COPY.specialAction.done}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // President: waiting for investigation target to consent.
  if (investigationWaitingForPlayerId) {
    const waitingPlayer = players.find(
      (p) => p.id === investigationWaitingForPlayerId,
    );
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config.heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {SECRET_VILLAIN_COPY.specialAction.investigateWaitingConsent(
              waitingPlayer?.name ?? investigationWaitingForPlayerId,
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  // President: policy peek — show cards with "Done" button, or "Peek" button before reveal.
  if (actionType === SpecialActionType.PolicyPeek) {
    if (peekedCards) {
      return (
        <PolicyPeekView
          peekedCards={peekedCards}
          onConfirm={onResolve ?? onConfirm}
          isPending={isPending}
        />
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config.heading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            {SECRET_VILLAIN_COPY.specialAction.policyPeekInstructions}
          </p>
          {onPeek && (
            <Button onClick={onPeek} disabled={!!isPending}>
              {SECRET_VILLAIN_COPY.specialAction.policyPeekReveal}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // President: select a target player.
  return (
    <PlayerSelectionView
      heading={config.heading}
      instructions={config.instructions}
      confirmLabel={config.confirm}
      players={players}
      selectedPlayerId={selectedPlayerId}
      onSelectPlayer={onSelectPlayer}
      onConfirm={onConfirm}
      isPending={isPending}
    />
  );
}
