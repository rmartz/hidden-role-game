"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";

interface ElectionNominationViewProps {
  presidentName: string;
  eligiblePlayers: { id: string; name: string }[];
  selectedPlayerId?: string;
  onSelectPlayer: (playerId: string) => void;
  onConfirm: () => void;
  isPending?: boolean;
  isPresident: boolean;
}

export function ElectionNominationView({
  presidentName,
  eligiblePlayers,
  selectedPlayerId,
  onSelectPlayer,
  onConfirm,
  isPending,
  isPresident,
}: ElectionNominationViewProps) {
  if (!isPresident) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {SECRET_VILLAIN_COPY.election.nominationHeading}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {SECRET_VILLAIN_COPY.election.nominationInstructions(presidentName)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{SECRET_VILLAIN_COPY.election.nominationHeading}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {SECRET_VILLAIN_COPY.election.selectChancellor}
        </p>
        <div className="flex flex-col gap-2">
          {eligiblePlayers.map((player) => (
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
          {SECRET_VILLAIN_COPY.election.confirmNomination}
        </Button>
      </CardContent>
    </Card>
  );
}
