"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";
import { SpecialActionType } from "@/lib/game-modes/secret-villain/types";
import { cn } from "@/lib/utils";

interface SpecialActionViewProps {
  actionType: SpecialActionType;
  isPresident: boolean;
  presidentName: string;
  players: { id: string; name: string }[];
  selectedPlayerId?: string;
  onSelectPlayer: (playerId: string) => void;
  onConfirm: () => void;
  isPending?: boolean;
  investigationResult?: { targetPlayerId: string; team: string };
  investigationConsent?: boolean;
  onConsent?: () => void;
  peekedCards?: string[];
}

const ACTION_CONFIG: Record<
  string,
  { heading: string; instructions: string; confirm: string }
> = {
  "investigate-team": {
    heading: SECRET_VILLAIN_COPY.specialAction.investigateHeading,
    instructions: SECRET_VILLAIN_COPY.specialAction.investigateInstructions,
    confirm: SECRET_VILLAIN_COPY.specialAction.investigateConfirm,
  },
  "special-election": {
    heading: SECRET_VILLAIN_COPY.specialAction.specialElectionHeading,
    instructions: SECRET_VILLAIN_COPY.specialAction.specialElectionInstructions,
    confirm: SECRET_VILLAIN_COPY.specialAction.specialElectionConfirm,
  },
  shoot: {
    heading: SECRET_VILLAIN_COPY.specialAction.shootHeading,
    instructions: SECRET_VILLAIN_COPY.specialAction.shootInstructions,
    confirm: SECRET_VILLAIN_COPY.specialAction.shootConfirm,
  },
  "policy-peek": {
    heading: SECRET_VILLAIN_COPY.specialAction.policyPeekHeading,
    instructions: SECRET_VILLAIN_COPY.specialAction.policyPeekInstructions,
    confirm: SECRET_VILLAIN_COPY.specialAction.policyPeekConfirm,
  },
};

function InvestigationConsentContent({
  onConsent,
  isPending,
}: {
  onConsent?: () => void;
  isPending?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {SECRET_VILLAIN_COPY.specialAction.investigateHeading}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {SECRET_VILLAIN_COPY.specialAction.investigateConsent}
        </p>
        {onConsent && (
          <Button onClick={onConsent} disabled={!!isPending}>
            {SECRET_VILLAIN_COPY.specialAction.investigateReveal}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function PolicyPeekContent({
  peekedCards,
  onConfirm,
  isPending,
}: {
  peekedCards: string[];
  onConfirm: () => void;
  isPending?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {SECRET_VILLAIN_COPY.specialAction.policyPeekHeading}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {SECRET_VILLAIN_COPY.specialAction.policyPeekInstructions}
        </p>
        <div className="flex gap-2">
          {peekedCards.map((card, index) => (
            <div
              key={index}
              className={cn(
                "rounded border-2 px-4 py-2 text-sm font-medium",
                card === "good"
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-red-500 bg-red-500 text-white",
              )}
            >
              {card === "good"
                ? SECRET_VILLAIN_COPY.policy.goodCard
                : SECRET_VILLAIN_COPY.policy.badCard}
            </div>
          ))}
        </div>
        <Button onClick={onConfirm} disabled={!!isPending}>
          {SECRET_VILLAIN_COPY.specialAction.policyPeekConfirm}
        </Button>
      </CardContent>
    </Card>
  );
}

function PlayerSelectionContent({
  config,
  players,
  selectedPlayerId,
  onSelectPlayer,
  onConfirm,
  isPending,
  investigationResult,
}: {
  config: { heading: string; instructions: string; confirm: string };
  players: { id: string; name: string }[];
  selectedPlayerId?: string;
  onSelectPlayer: (playerId: string) => void;
  onConfirm: () => void;
  isPending?: boolean;
  investigationResult?: { targetPlayerId: string; team: string };
}) {
  const targetPlayer = investigationResult
    ? players.find((p) => p.id === investigationResult.targetPlayerId)
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.heading}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {investigationResult && targetPlayer ? (
          <p className="text-sm font-medium">
            {SECRET_VILLAIN_COPY.specialAction.investigateResult(
              targetPlayer.name,
              investigationResult.team,
            )}
          </p>
        ) : (
          <>
            <p className="text-sm">{config.instructions}</p>
            <div className="flex flex-col gap-2">
              {players.map((player) => (
                <Button
                  key={player.id}
                  variant={
                    selectedPlayerId === player.id ? "default" : "outline"
                  }
                  onClick={() => {
                    onSelectPlayer(player.id);
                  }}
                >
                  {player.name}
                </Button>
              ))}
            </div>
            <Button
              onClick={onConfirm}
              disabled={!selectedPlayerId || !!isPending}
            >
              {config.confirm}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function SpecialActionView({
  actionType,
  isPresident,
  players,
  selectedPlayerId,
  onSelectPlayer,
  onConfirm,
  isPending,
  investigationResult,
  investigationConsent,
  onConsent,
  peekedCards,
}: SpecialActionViewProps) {
  const config = ACTION_CONFIG[actionType];

  if (!isPresident) {
    if (
      actionType === SpecialActionType.InvestigateTeam &&
      investigationConsent &&
      onConsent
    ) {
      return (
        <InvestigationConsentContent
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
            {SECRET_VILLAIN_COPY.policy.waitingForPresident}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return null;
  }

  if (actionType === SpecialActionType.PolicyPeek && peekedCards) {
    return (
      <PolicyPeekContent
        peekedCards={peekedCards}
        onConfirm={onConfirm}
        isPending={isPending}
      />
    );
  }

  return (
    <PlayerSelectionContent
      config={config}
      players={players}
      selectedPlayerId={selectedPlayerId}
      onSelectPlayer={onSelectPlayer}
      onConfirm={onConfirm}
      isPending={isPending}
      investigationResult={investigationResult}
    />
  );
}
