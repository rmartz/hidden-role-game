import type { PublicLobbyPlayer } from "@/server/models";

interface Props {
  player: PublicLobbyPlayer;
  ownerPlayerId: string;
  userPlayerId: string | null;
  showRemovePlayer: boolean;
  gameStarted: boolean;
  isRemovePending: boolean;
  onRemovePlayer: (playerId: string) => void;
}

export default function PlayerRow({
  player,
  ownerPlayerId,
  userPlayerId,
  showRemovePlayer,
  gameStarted,
  isRemovePending,
  onRemovePlayer,
}: Props) {
  function handleLeave() {
    if (window.confirm("Leave this lobby?")) onRemovePlayer(player.id);
  }

  function handleRemove() {
    if (window.confirm(`Remove ${player.name} from the lobby?`))
      onRemovePlayer(player.id);
  }

  return (
    <li style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {player.name}
      {player.id === ownerPlayerId && "(Lobby owner)"}
      {player.id === userPlayerId && !showRemovePlayer && !gameStarted && (
        <button onClick={handleLeave} disabled={isRemovePending}>
          Leave
        </button>
      )}
      {showRemovePlayer && player.id !== userPlayerId && !gameStarted && (
        <button onClick={handleRemove} disabled={isRemovePending}>
          Remove
        </button>
      )}
    </li>
  );
}
