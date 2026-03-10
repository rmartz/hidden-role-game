import type { PublicLobbyPlayer } from "@/server/models";

interface Props {
  player: PublicLobbyPlayer;
  ownerPlayerId: string;
  isCurrentUser: boolean;
  showLeave: boolean;
  showRemovePlayer: boolean;
  showMakeOwner: boolean;
  disabled: boolean;
  onRemovePlayer: (playerId: string) => void;
  onTransferOwner: (playerId: string) => void;
}

export function PlayerRow({
  player,
  ownerPlayerId,
  isCurrentUser,
  showLeave,
  showRemovePlayer,
  showMakeOwner,
  disabled,
  onRemovePlayer,
  onTransferOwner,
}: Props) {
  function handleLeave() {
    if (window.confirm("Leave this lobby?")) onRemovePlayer(player.id);
  }

  function handleRemove() {
    if (window.confirm(`Remove ${player.name} from the lobby?`))
      onRemovePlayer(player.id);
  }

  function handleTransferOwner() {
    if (window.confirm(`Make ${player.name} the lobby owner?`))
      onTransferOwner(player.id);
  }

  return (
    <li style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {player.name}
      {player.id === ownerPlayerId && "(Lobby owner)"}
      {isCurrentUser && showLeave && (
        <button onClick={handleLeave} disabled={disabled}>
          Leave
        </button>
      )}
      {!isCurrentUser && showRemovePlayer && (
        <button onClick={handleRemove} disabled={disabled}>
          Remove
        </button>
      )}
      {!isCurrentUser && showMakeOwner && (
        <button onClick={handleTransferOwner} disabled={disabled}>
          Make Owner
        </button>
      )}
    </li>
  );
}
