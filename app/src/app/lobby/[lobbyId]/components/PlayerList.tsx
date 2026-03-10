import type { PublicLobby } from "@/server/models";
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
      <p>
        Players: {lobby.players.length}{" "}
        {showRefresh && (
          <button onClick={onRefetch} disabled={isFetching}>
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </p>
      <ul>
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
