"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import type { PublicLobby } from "@/server/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlayerRow } from "./PlayerRow";
import { PLAYER_LIST_COPY } from "./PlayerList.copy";

interface PlayerListProps {
  lobby: PublicLobby;
  userPlayerId?: string;
  isOwner: boolean;
  showLeave: boolean;
  showRemovePlayer: boolean;
  showMakeOwner: boolean;
  showRefresh: boolean;
  isFetching: boolean;
  disabled: boolean;
  isReadyPending: boolean;
  onRefetch: () => void;
  onRemovePlayer: (playerId: string) => void;
  onTransferOwner: (playerId: string) => void;
  onToggleReady: () => void;
  onReorderPlayers?: (playerOrder: string[]) => void;
}

// dropBeforeId: string = insert before that player, null = insert at end
function computeDropOrder(
  currentOrder: string[],
  sourceId: string,
  dropBeforeId: string | null,
): string[] {
  const without = currentOrder.filter((id) => id !== sourceId);
  if (dropBeforeId === null) return [...without, sourceId];
  const insertAt = without.indexOf(dropBeforeId);
  return insertAt === -1
    ? [...without, sourceId]
    : [...without.slice(0, insertAt), sourceId, ...without.slice(insertAt)];
}

export function PlayerList({
  lobby,
  userPlayerId,
  isOwner,
  showLeave,
  showRemovePlayer,
  showMakeOwner,
  showRefresh,
  isFetching,
  disabled,
  isReadyPending,
  onRefetch,
  onRemovePlayer,
  onTransferOwner,
  onToggleReady,
  onReorderPlayers,
}: PlayerListProps) {
  const readySet = new Set(lobby.readyPlayerIds);
  const isCurrentUserReady = !!userPlayerId && readySet.has(userPlayerId);

  const playerMap = new Map(lobby.players.map((p) => [p.id, p]));

  const nonOwnerPlayers = lobby.players.filter(
    (p) => p.id !== lobby.ownerPlayerId,
  );
  const allPlayersReady =
    nonOwnerPlayers.length > 0 &&
    nonOwnerPlayers.every((p) => readySet.has(p.id));

  const [committedOrder, setCommittedOrder] = useState<string[]>(
    () => lobby.playerOrder,
  );
  const [dragSourceId, setDragSourceId] = useState<string | undefined>(
    undefined,
  );
  // null = drop at end of list, undefined = no active drop target
  const [dropBeforeId, setDropBeforeId] = useState<string | null | undefined>(
    undefined,
  );

  // Track drag-in-progress in a ref so the effect below only depends on
  // lobby.playerOrder — otherwise clearing dragSourceId state on drop would
  // re-trigger the effect and overwrite the just-committed optimistic order.
  const isDraggingRef = useRef(false);

  // Sync committedOrder when the server sends a new player order, but not
  // while a drag is in progress to avoid disrupting a mid-drag interaction.
  useEffect(() => {
    if (!isDraggingRef.current) {
      setCommittedOrder(lobby.playerOrder);
    }
  }, [lobby.playerOrder]);

  const displayPlayers = committedOrder
    .map((id) => playerMap.get(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  function handleDragStart(playerId: string) {
    isDraggingRef.current = true;
    setDragSourceId(playerId);
  }

  function handleDragOver(targetPlayerId: string) {
    setDropBeforeId(targetPlayerId);
  }

  function handleDragOverEnd(e: React.DragEvent) {
    e.preventDefault();
    setDropBeforeId(null);
  }

  function handleDragEnd() {
    if (dragSourceId && dropBeforeId !== undefined) {
      const finalOrder = computeDropOrder(
        committedOrder,
        dragSourceId,
        dropBeforeId,
      );
      const unchanged =
        finalOrder.length === committedOrder.length &&
        finalOrder.every((id, i) => id === committedOrder[i]);
      if (!unchanged) {
        setCommittedOrder(finalOrder);
        onReorderPlayers?.(finalOrder);
      }
    }
    isDraggingRef.current = false;
    setDragSourceId(undefined);
    setDropBeforeId(undefined);
  }

  const canReorder = !!onReorderPlayers && !disabled;
  // Owners can drag any player; non-owners can only drag themselves.
  const canDragRow = (playerId: string) =>
    canReorder && (isOwner || playerId === userPlayerId);

  const anyRowDraggable =
    canReorder &&
    displayPlayers.some((p) => canDragRow(p.id)) &&
    displayPlayers.length > 1;

  const dragHint = isOwner
    ? PLAYER_LIST_COPY.dragHint
    : PLAYER_LIST_COPY.dragHintSelf;

  return (
    <Card className="mb-5">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <CardTitle>
          {PLAYER_LIST_COPY.title} ({lobby.players.length})
        </CardTitle>
        {showRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefetch}
            disabled={isFetching}
          >
            {isFetching
              ? PLAYER_LIST_COPY.refreshingButton
              : PLAYER_LIST_COPY.refreshButton}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {anyRowDraggable && (
          <p className="text-xs text-muted-foreground mb-2">{dragHint}</p>
        )}
        <ul className={cn("space-y-1", dragSourceId && "select-none")}>
          {displayPlayers.map((player) => (
            <Fragment key={player.id}>
              {dropBeforeId === player.id && dropBeforeId !== dragSourceId && (
                <li
                  aria-hidden="true"
                  className="h-0.5 bg-primary rounded-full mx-[10%]"
                />
              )}
              <PlayerRow
                player={player}
                ownerPlayerId={lobby.ownerPlayerId}
                isCurrentUser={player.id === userPlayerId}
                isReady={readySet.has(player.id)}
                showLeave={showLeave}
                showRemovePlayer={showRemovePlayer}
                showMakeOwner={showMakeOwner}
                disabled={disabled}
                canDrag={canDragRow(player.id)}
                canReceiveDrop={canReorder}
                onRemovePlayer={onRemovePlayer}
                onTransferOwner={onTransferOwner}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              />
            </Fragment>
          ))}
          {dragSourceId && dropBeforeId === null && (
            <li
              aria-hidden="true"
              className="h-0.5 bg-primary rounded-full mx-[10%]"
            />
          )}
          {dragSourceId && (
            <li
              aria-hidden="true"
              className="h-4"
              onDragOver={handleDragOverEnd}
            />
          )}
        </ul>
        {!isOwner && (
          <Button
            variant={isCurrentUserReady ? "secondary" : "default"}
            size="sm"
            className="mt-3"
            disabled={disabled || isReadyPending}
            onClick={onToggleReady}
          >
            {isCurrentUserReady
              ? PLAYER_LIST_COPY.notReadyButton
              : PLAYER_LIST_COPY.readyButton}
          </Button>
        )}
        {allPlayersReady && (
          <p className="text-sm text-green-600 font-medium mt-2">
            {PLAYER_LIST_COPY.allPlayersReady}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
