import type { PublicLobby } from "@/server/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerRow } from "./PlayerRow";

interface Props {
  lobby: PublicLobby;
  userPlayerId: string | null;
  showLeave: boolean;
  showRemovePlayer: boolean;
  showMakeOwner: boolean;
  showRefresh: boolean;
  isFetching: boolean;
  disabled: boolean;
  onRefetch: () => void;
  onRemovePlayer: (playerId: string) => void;
  onTransferOwner: (playerId: string) => void;
}

export function PlayerList({
  lobby,
  userPlayerId,
  showLeave,
  showRemovePlayer,
  showMakeOwner,
  showRefresh,
  isFetching,
  disabled,
  onRefetch,
  onRemovePlayer,
  onTransferOwner,
}: Props) {
  return (
    <Card className="mb-5">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <CardTitle>Players ({lobby.players.length})</CardTitle>
        {showRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefetch}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {lobby.players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              ownerPlayerId={lobby.ownerPlayerId}
              isCurrentUser={player.id === userPlayerId}
              showLeave={showLeave}
              showRemovePlayer={showRemovePlayer}
              showMakeOwner={showMakeOwner}
              disabled={disabled}
              onRemovePlayer={onRemovePlayer}
              onTransferOwner={onTransferOwner}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
