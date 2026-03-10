import type { PublicLobby } from "@/server/models";
import { Button } from "@/components/ui/button";
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
    <>
      <div className="flex items-center gap-3 mb-2">
        <p className="text-sm text-muted-foreground">
          Players: {lobby.players.length}
        </p>
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
      </div>
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
    </>
  );
}
