"use client";

import { useCallback } from "react";
import { WEREWOLF_COPY, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NominationRow } from "./NominationRow";

interface NominationPanelProps {
  gameId: string;
  players: PlayerGameState["players"];
  myPlayerId?: string;
  amDead?: boolean;
  nominations: NonNullable<PlayerGameState["nominations"]>;
  myNominatedDefendantId?: string;
  deadPlayerIds?: string[];
  gameOwnerId?: string;
}

export function NominationPanel({
  gameId,
  players,
  myPlayerId,
  amDead,
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

  const eligiblePlayers = players.filter(
    (p) =>
      p.id !== myPlayerId &&
      p.id !== gameOwnerId &&
      !(deadPlayerIds ?? []).includes(p.id),
  );

  const nominationMap = new Map(
    nominations.map((n) => [n.defendantId, n.nominatorIds]),
  );

  const canAct = !!myPlayerId && !amDead;

  const nominatedPlayers = eligiblePlayers.filter(
    (p) => (nominationMap.get(p.id)?.length ?? 0) > 0,
  );
  const unnominatedPlayers = eligiblePlayers.filter(
    (p) => (nominationMap.get(p.id)?.length ?? 0) === 0,
  );

  const myNomination = myPlayerId
    ? nominations.find((n) => n.nominatorIds.includes(myPlayerId))
    : undefined;
  const myNominatorId = myPlayerId
    ? nominations.find((n) => n.defendantId === myPlayerId)?.nominatorIds[0]
    : undefined;
  const myNominatorName = myNominatorId
    ? players.find((p) => p.id === myNominatorId)?.name
    : undefined;

  return (
    <Card className="p-4 mb-4">
      <p className="font-semibold mb-1">{nomination.heading}</p>
      <p className="text-sm text-muted-foreground mb-3">
        {nomination.subtitle}
      </p>
      {myNominatorName && (
        <p className="text-sm font-medium text-destructive mb-3">
          {nomination.youAreNominated(myNominatorName)}
        </p>
      )}
      <ul className="space-y-2">
        {nominatedPlayers.map((player) => (
          <NominationRow
            key={player.id}
            player={player}
            nominatorIds={nominationMap.get(player.id) ?? []}
            players={players}
            isMyTarget={myNominatedDefendantId === player.id}
            canAct={canAct}
            isPending={action.isPending}
            onNominate={nominate}
          />
        ))}
        {unnominatedPlayers.map((player) => (
          <NominationRow
            key={player.id}
            player={player}
            nominatorIds={[]}
            players={players}
            isMyTarget={myNominatedDefendantId === player.id}
            canAct={canAct}
            isPending={action.isPending}
            onNominate={nominate}
          />
        ))}
      </ul>
      {canAct && myNomination && (
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
