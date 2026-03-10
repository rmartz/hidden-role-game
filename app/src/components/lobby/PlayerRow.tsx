import type { PublicLobbyPlayer } from "@/server/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <li className="flex items-center gap-2 py-1">
      <span>{player.name}</span>
      {player.id === ownerPlayerId && (
        <Badge variant="secondary">Lobby owner</Badge>
      )}
      {isCurrentUser && showLeave && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleLeave}
          disabled={disabled}
        >
          Leave
        </Button>
      )}
      {!isCurrentUser && showRemovePlayer && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleRemove}
          disabled={disabled}
        >
          Remove
        </Button>
      )}
      {!isCurrentUser && showMakeOwner && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleTransferOwner}
          disabled={disabled}
        >
          Make Owner
        </Button>
      )}
    </li>
  );
}
