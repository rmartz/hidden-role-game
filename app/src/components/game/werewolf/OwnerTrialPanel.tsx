"use client";

import { useCallback } from "react";
import type { ActiveTrial } from "@/lib/game-modes/werewolf";
import { WerewolfAction } from "@/lib/game-modes/werewolf";
import type { PublicLobbyPlayer } from "@/server/types/lobby";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

  const guiltyCount = activeTrial.votes.filter(
    (v) => v.vote === "guilty",
  ).length;
  const innocentCount = activeTrial.votes.filter(
    (v) => v.vote === "innocent",
  ).length;
  const abstainCount = activeTrial.votes.filter(
    (v) => v.vote === "abstain",
  ).length;

  const handleResolve = useCallback(() => {
    action.mutate({ actionId: WerewolfAction.ResolveTrial });
  }, [action]);

  if (activeTrial.verdict) {
    const verdictLabel =
      activeTrial.verdict === "eliminated" ? "Eliminated" : "Innocent";
    return (
      <Card className="p-4 mb-5">
        <p className="font-semibold mb-1">
          Trial verdict: <span className="font-bold">{defendantName}</span> —{" "}
          {verdictLabel}
        </p>
        <p className="text-sm text-muted-foreground">
          Guilty: {guiltyCount} · Innocent: {innocentCount} · Abstain:{" "}
          {abstainCount}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-5">
      <p className="font-semibold mb-2">
        Trial: <span className="font-bold">{defendantName}</span>
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        Guilty: {guiltyCount} · Innocent: {innocentCount} · Abstain:{" "}
        {abstainCount} · Total votes: {activeTrial.votes.length}
      </p>
      <Button size="sm" onClick={handleResolve} disabled={action.isPending}>
        Resolve Trial
      </Button>
    </Card>
  );
}
