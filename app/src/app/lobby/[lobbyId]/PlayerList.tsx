import type { PublicLobby } from "@/server/models";
import PlayerRow from "./PlayerRow";

interface Props {
  lobby: PublicLobby;
  userPlayerId: string | null;
  showRemovePlayer: boolean;
  gameStarted: boolean;
  isFetching: boolean;
  isRemovePending: boolean;
  onRefetch: () => void;
  onRemovePlayer: (playerId: string) => void;
}

export default function PlayerList({
  lobby,
  userPlayerId,
  showRemovePlayer,
  gameStarted,
  isFetching,
  isRemovePending,
  onRefetch,
  onRemovePlayer,
}: Props) {
  return (
    <>
      <p>
        Players: {lobby.players.length}{" "}
        <button onClick={onRefetch} disabled={isFetching}>
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </p>
      <ul>
        {lobby.players.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            ownerPlayerId={lobby.ownerPlayerId}
            userPlayerId={userPlayerId}
            showRemovePlayer={showRemovePlayer}
            gameStarted={gameStarted}
            isRemovePending={isRemovePending}
            onRemovePlayer={onRemovePlayer}
          />
        ))}
      </ul>
    </>
  );
}
