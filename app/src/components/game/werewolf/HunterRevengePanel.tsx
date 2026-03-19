"use client";

import { useState, useCallback } from "react";
import { WerewolfAction } from "@/lib/game-modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";
import type { PublicLobbyPlayer } from "@/server/types";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HunterRevengePanelProps {
  gameId: string;
  hunterRevengePlayerId: string;
  players: PublicLobbyPlayer[];
  deadPlayerIds: string[];
}

export function HunterRevengePanel({
  gameId,
  hunterRevengePlayerId,
  players,
  deadPlayerIds,
}: HunterRevengePanelProps) {
  const action = useGameAction(gameId);
  const [selectedTargetId, setSelectedTargetId] = useState<string>();

  const hunterName =
    players.find((p) => p.id === hunterRevengePlayerId)?.name ?? "The Hunter";

  const aliveTargets = players.filter(
    (p) => !deadPlayerIds.includes(p.id) && p.id !== hunterRevengePlayerId,
  );

  const handleConfirm = useCallback(() => {
    if (!selectedTargetId) return;
    action.mutate({
      actionId: WerewolfAction.ResolveHunterRevenge,
      payload: { targetPlayerId: selectedTargetId },
    });
  }, [action, selectedTargetId]);

  return (
    <Card className="border-destructive">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm text-destructive">
          {WEREWOLF_COPY.hunter.revengeTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-3">
          {WEREWOLF_COPY.hunter.revengePrompt(hunterName)}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {aliveTargets.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant={selectedTargetId === p.id ? "default" : "outline"}
              onClick={() => { setSelectedTargetId(p.id); }}
            >
              {p.name}
            </Button>
          ))}
        </div>
        <Button
          onClick={handleConfirm}
          disabled={!selectedTargetId || action.isPending}
          variant="destructive"
          className="w-full"
        >
          {WEREWOLF_COPY.hunter.revengeConfirm}
        </Button>
      </CardContent>
    </Card>
  );
}
