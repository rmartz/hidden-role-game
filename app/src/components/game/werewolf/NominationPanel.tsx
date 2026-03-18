"use client";

import { useCallback } from "react";
import { WEREWOLF_COPY, WerewolfAction } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NominationPanelProps {
  gameId: string;
  players: PlayerGameState["players"];
  myPlayerId?: string;
  amDead?: boolean;
  nominations: NonNullable<PlayerGameState["nominations"]>;
  myNominatedDefendantId?: string;
  nominationThreshold: number;
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
  nominationThreshold,
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

  const canNominate = !!myPlayerId && !amDead && !hasActiveTrial;

  return (
    <Card className="p-4 mb-4">
      <p className="font-semibold mb-1">{nomination.heading}</p>
      <p className="text-sm text-muted-foreground mb-3">
        {nomination.autoTrialNote(nominationThreshold)}
      </p>
      <ul className="space-y-2">
        {eligiblePlayers.map((player) => {
          const count = nominationMap.get(player.id) ?? 0;
          const isMyTarget = myNominatedDefendantId === player.id;
          const buttonLabel =
            count > 0
              ? nomination.secondButton(player.name)
              : nomination.nominateButton(player.name);
          return (
            <li key={player.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm">{player.name}</span>
              {count > 0 && (
                <span className="text-xs text-muted-foreground">
                  {nomination.nominationCount(count, nominationThreshold)}
                </span>
              )}
              {canNominate && !isMyTarget && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    nominate(player.id);
                  }}
                  disabled={action.isPending}
                >
                  {buttonLabel}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {canNominate && myNominatedDefendantId && (
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
