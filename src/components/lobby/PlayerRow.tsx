import type { PublicLobbyPlayer } from "@/server/types";
import { GripVerticalIcon } from "lucide-react";
import { CheckmarkCircleRegular } from "@fluentui/react-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  /** Show grip and allow this row to be dragged. */
  canDrag?: boolean;
  /** Accept dragover events so other players can be dropped here. */
  canReceiveDrop?: boolean;
  onRemovePlayer: (playerId: string) => void;
  onTransferOwner: (playerId: string) => void;
  onDragStart?: (playerId: string) => void;
  onDragOver?: (playerId: string) => void;
  onDragEnd?: () => void;
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
  canDrag,
  canReceiveDrop,
  onRemovePlayer,
  onTransferOwner,
  onDragStart,
  onDragOver,
  onDragEnd,
}: PlayerRowProps) {
  return (
    <li
      className={cn("flex items-center gap-2 py-1", canDrag && "select-none")}
      onDragOver={
        canReceiveDrop
          ? (e) => {
              e.preventDefault();
              onDragOver?.(player.id);
            }
          : undefined
      }
      onDragEnd={canDrag ? onDragEnd : undefined}
    >
      {canReceiveDrop && (
        <span
          className={cn(
            "shrink-0 h-4 w-4",
            canDrag ? "cursor-grab" : "invisible",
          )}
          draggable={canDrag}
          onDragStart={
            canDrag
              ? (e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", player.id);
                  const rowEl = (e.currentTarget as HTMLElement).closest("li");
                  if (rowEl) {
                    const clone = rowEl.cloneNode(true) as HTMLElement;
                    clone.style.position = "fixed";
                    clone.style.top = "-9999px";
                    clone.style.left = "0";
                    clone.style.width = `${String(rowEl.offsetWidth)}px`;
                    clone.style.pointerEvents = "none";
                    document.body.appendChild(clone);
                    e.dataTransfer.setDragImage(
                      clone,
                      20,
                      rowEl.offsetHeight / 2,
                    );
                    requestAnimationFrame(() => {
                      document.body.removeChild(clone);
                    });
                  }
                  onDragStart?.(player.id);
                }
              : undefined
          }
        >
          {canDrag && (
            <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
      )}
      <CheckmarkCircleRegular
        className={cn(
          "h-5 w-5 shrink-0",
          isReady ? "text-green-600" : "invisible",
        )}
      />
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
