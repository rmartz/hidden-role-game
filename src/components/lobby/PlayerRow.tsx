import type { PublicLobbyPlayer } from "@/server/types";
import { CheckmarkCircleRegular } from "@fluentui/react-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PLAYER_ROW_COPY } from "./PlayerRow.copy";

interface PlayerRowProps {
  player: PublicLobbyPlayer;
  ownerPlayerId: string;
  isCurrentUser: boolean;
  isReady: boolean;
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
  isReady,
  showLeave,
  showRemovePlayer,
  showMakeOwner,
  disabled,
  onRemovePlayer,
  onTransferOwner,
}: PlayerRowProps) {
  return (
    <li className="flex items-center gap-2 py-1">
      {isReady && (
        <CheckmarkCircleRegular className="text-green-600 h-5 w-5 shrink-0" />
      )}
      <span>{player.name}</span>
      {player.id === ownerPlayerId && (
        <Badge variant="secondary">Lobby owner</Badge>
      )}
      {isCurrentUser && showLeave && (
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="outline" size="sm" disabled={disabled} />}
          >
            {PLAYER_ROW_COPY.leaveButton}
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>{PLAYER_ROW_COPY.leaveTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {PLAYER_ROW_COPY.leaveDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {PLAYER_ROW_COPY.leaveCancel}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  onRemovePlayer(player.id);
                }}
              >
                {PLAYER_ROW_COPY.leaveConfirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {!isCurrentUser && showRemovePlayer && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="destructive" size="sm" disabled={disabled} />
            }
          >
            {PLAYER_ROW_COPY.removeButton}
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {PLAYER_ROW_COPY.removeTitle(player.name)}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {PLAYER_ROW_COPY.removeDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {PLAYER_ROW_COPY.removeCancel}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  onRemovePlayer(player.id);
                }}
              >
                {PLAYER_ROW_COPY.removeConfirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {!isCurrentUser && showMakeOwner && (
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="outline" size="sm" disabled={disabled} />}
          >
            {PLAYER_ROW_COPY.makeOwnerButton}
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {PLAYER_ROW_COPY.transferTitle(player.name)}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {PLAYER_ROW_COPY.transferDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {PLAYER_ROW_COPY.transferCancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onTransferOwner(player.id);
                }}
              >
                {PLAYER_ROW_COPY.transferConfirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </li>
  );
}
