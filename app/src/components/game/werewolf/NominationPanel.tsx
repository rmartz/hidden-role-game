"use client";

import { useCallback } from "react";
import {
  WEREWOLF_COPY,
  WerewolfAction,
  NOMINATION_VOTE_THRESHOLD,
} from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NominationRowProps {
  player: { id: string; name: string };
  count: number;
  isMyTarget: boolean;
  canAct: boolean;
  isPending: boolean;
  onNominate: (defendantId: string) => void;
}

function NominationRow({
  player,
  count,
  isMyTarget,
  canAct,
  isPending,
  onNominate,
}: NominationRowProps) {
  const { nomination } = WEREWOLF_COPY;
  const buttonLabel =
    count > 0
      ? nomination.secondButton(player.name)
      : nomination.nominateButton(player.name);

  const actionElement = isMyTarget ? (
    <span className="text-xs text-muted-foreground italic">
      {nomination.yourNomination}
    </span>
  ) : canAct ? (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        onNominate(player.id);
      }}
      disabled={isPending}
    >
      {buttonLabel}
    </Button>
  ) : null;

  return (
    <li className="flex items-center gap-3">
      <span className="flex-1 text-sm">{player.name}</span>
      {count > 0 && (
        <span className="text-xs text-muted-foreground">
          {nomination.nominationCount(count, NOMINATION_VOTE_THRESHOLD)}
        </span>
      )}
      {actionElement}
    </li>
  );
}

interface NominationPanelProps {
  gameId: string;
  players: PlayerGameState["players"];
  myPlayerId?: string;
  amDead?: boolean;
  nominations: NonNullable<PlayerGameState["nominations"]>;
  myNominatedDefendantId?: string;
  deadPlayerIds?: string[];
  gameOwnerId?: string;
  hasActiveTrial: boolean;
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
  hasActiveTrial,
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
    nominations.map((n) => [n.defendantId, n.count]),
  );

  // Can act = alive, non-owner player, no active trial in progress
  const canAct = !!myPlayerId && !amDead && !hasActiveTrial;

  return (
    <Card className="p-4 mb-4">
      <p className="font-semibold mb-1">{nomination.heading}</p>
      <p className="text-sm text-muted-foreground mb-3">
        {nomination.autoTrialNote(NOMINATION_VOTE_THRESHOLD)}
      </p>
      <ul className="space-y-2">
        {eligiblePlayers.map((player) => (
          <NominationRow
            key={player.id}
            player={player}
            count={nominationMap.get(player.id) ?? 0}
            isMyTarget={myNominatedDefendantId === player.id}
            canAct={canAct}
            isPending={action.isPending}
            onNominate={nominate}
          />
        ))}
      </ul>
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
