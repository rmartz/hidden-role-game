"use client";

import { useCallback } from "react";
import { WEREWOLF_COPY, WerewolfAction } from "@/lib/game/modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NominationRow } from "./NominationRow";

interface NominationPanelProps {
  gameId: string;
  players: PlayerGameState["players"];
  myPlayerId?: string;
  amDead?: boolean;
  isSilenced?: boolean;
  nominations: NonNullable<WerewolfPlayerGameState["nominations"]>;
  myNominatedDefendantId?: string;
  deadPlayerIds?: string[];
  gameOwnerId?: string;
}

export function NominationPanel({
  gameId,
  players,
  myPlayerId,
  amDead,
  isSilenced,
  nominations,
  myNominatedDefendantId,
  deadPlayerIds,
  gameOwnerId,
}: NominationPanelProps) {
  const action = useGameAction(gameId);
  const { nomination } = WEREWOLF_COPY;

  const nominate = useCallback(
    (defendantId: string) => {
      action.mutate({
        actionId: WerewolfAction.NominatePlayer,
        payload: { defendantId },
      });
    },
    [action],
  );

  const withdraw = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.WithdrawNomination });
  }, [action]);

  const playerById = new Map(players.map((p) => [p.id, p]));

  const eligiblePlayers = players.filter(
    (p) =>
      p.id !== myPlayerId &&
      p.id !== gameOwnerId &&
      !(deadPlayerIds ?? []).includes(p.id),
  );

  const nominationMap = new Map(
    nominations.map((n) => [n.defendantId, n.nominatorIds]),
  );

  const canAct = !!myPlayerId && !amDead && !isSilenced;

  const nominatedPlayers = eligiblePlayers.filter(
    (p) => (nominationMap.get(p.id)?.length ?? 0) > 0,
  );
  const unnominatedPlayers = eligiblePlayers.filter(
    (p) => (nominationMap.get(p.id)?.length ?? 0) === 0,
  );

  // Check if the current player has been nominated by someone.
  const myNominatorId = myPlayerId
    ? nominations.find((n) => n.defendantId === myPlayerId)?.nominatorIds[0]
    : undefined;
  const myNominatorName = myNominatorId
    ? playerById.get(myNominatorId)?.name
    : undefined;

  return (
    <Card className="p-4 mb-4">
      <p className="font-semibold mb-1">{nomination.heading}</p>
      <p className="text-sm text-muted-foreground mb-3">
        {nomination.subtitle}
      </p>
      {isSilenced && !!myPlayerId && !amDead && (
        <p className="text-sm font-medium text-amber-600 mb-3">
          {WEREWOLF_COPY.silence.cannotNominate}
        </p>
      )}
      {myNominatorName && (
        <p className="text-sm font-medium text-destructive mb-3">
          {nomination.youAreNominated(myNominatorName)}
        </p>
      )}
      {nominatedPlayers.length > 0 && (
        <>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {nomination.secondSectionHeading}
          </p>
          <ul className="space-y-2">
            {nominatedPlayers.map((player) => {
              const nominatorIds = nominationMap.get(player.id) ?? [];
              const nominatorName = playerById.get(nominatorIds[0] ?? "")?.name;
              return (
                <NominationRow
                  key={player.id}
                  player={player}
                  nominatorName={nominatorName}
                  isMyTarget={myNominatedDefendantId === player.id}
                  canAct={canAct}
                  isNominated
                  isPending={action.isPending}
                  onNominate={nominate}
                />
              );
            })}
          </ul>
        </>
      )}
      {unnominatedPlayers.length > 0 && (
        <>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 mt-4">
            {nomination.nominateSectionHeading}
          </p>
          <ul className="space-y-2">
            {unnominatedPlayers.map((player) => (
              <NominationRow
                key={player.id}
                player={player}
                isMyTarget={myNominatedDefendantId === player.id}
                canAct={canAct}
                isNominated={false}
                isPending={action.isPending}
                onNominate={nominate}
              />
            ))}
          </ul>
        </>
      )}
      {canAct && myNominatedDefendantId && (
        <div className="mt-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={withdraw}
            disabled={action.isPending}
          >
            {nomination.withdrawButton}
          </Button>
        </div>
      )}
    </Card>
  );
}
