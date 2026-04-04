"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PlayerSelectionViewProps {
  heading: string;
  instructions: string;
  confirmLabel: string;
  players: { id: string; name: string }[];
  selectedPlayerId?: string;
  onSelectPlayer: (playerId: string) => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export function PlayerSelectionView({
  heading,
  instructions,
  confirmLabel,
  players,
  selectedPlayerId,
  onSelectPlayer,
  onConfirm,
  isPending,
}: PlayerSelectionViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{heading}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{instructions}</p>
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <Button
              key={player.id}
              variant={selectedPlayerId === player.id ? "default" : "outline"}
              onClick={() => {
                onSelectPlayer(player.id);
              }}
            >
              {player.name}
            </Button>
          ))}
        </div>
        <Button onClick={onConfirm} disabled={!selectedPlayerId || !!isPending}>
          {confirmLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
