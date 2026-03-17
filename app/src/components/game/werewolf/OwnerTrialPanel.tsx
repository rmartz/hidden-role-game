"use client";

import { useCallback } from "react";
import type { ActiveTrial } from "@/lib/game-modes/werewolf";
import { WerewolfAction } from "@/lib/game-modes/werewolf";
import type { PublicLobbyPlayer } from "@/server/types/lobby";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";

interface OwnerTrialPanelProps {
  gameId: string;
  activeTrial: ActiveTrial;
  players: PublicLobbyPlayer[];
}

export function OwnerTrialPanel({
  gameId,
  activeTrial,
  players,
}: OwnerTrialPanelProps) {
  const action = useGameAction(gameId);
  const defendant = players.find((p) => p.id === activeTrial.defendantId);
  const defendantName = defendant?.name ?? activeTrial.defendantId;
  const playerById = new Map(players.map((p) => [p.id, p]));

  const guiltyCount = activeTrial.votes.filter(
    (v) => v.vote === "guilty",
  ).length;
  const innocentCount = activeTrial.votes.filter(
    (v) => v.vote === "innocent",
  ).length;

  const handleResolve = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.ResolveTrial });
  }, [action]);

  if (activeTrial.verdict) {
    const verdictLabel =
      activeTrial.verdict === "eliminated" ? "Eliminated" : "Innocent";
    return (
      <div className="mb-3 pb-3 border-b">
        <p className="font-semibold mb-1">
          Verdict: <span className="font-bold">{defendantName}</span> —{" "}
          {verdictLabel}
        </p>
        <p className="text-sm text-muted-foreground">
          Guilty: {guiltyCount} · Innocent: {innocentCount}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-3 pb-3 border-b">
      <p className="font-semibold mb-2">
        Trial: <span className="font-bold">{defendantName}</span>
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        Guilty: {guiltyCount} · Innocent: {innocentCount} · Total votes:{" "}
        {activeTrial.votes.length}
      </p>
      {activeTrial.votes.length > 0 && (
        <ul className="text-sm text-muted-foreground mb-3 space-y-0.5">
          {activeTrial.votes.map((v) => (
            <li key={v.playerId}>
              {playerById.get(v.playerId)?.name ?? v.playerId}: {v.vote}
            </li>
          ))}
        </ul>
      )}
      <Button
        size="sm"
        className="w-full max-w-xs"
        onClick={handleResolve}
        disabled={action.isPending}
      >
        Resolve Trial
      </Button>
    </div>
  );
}
