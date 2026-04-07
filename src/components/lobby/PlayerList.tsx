"use client";

import { useState, useRef, useEffect } from "react";
import type { PublicLobby } from "@/server/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const [localOrder, setLocalOrder] = useState<string[]>(
    () => lobby.playerOrder,
  );
  const dragSourceIdRef = useRef<string | undefined>(undefined);
  const pendingOrderRef = useRef<string[] | undefined>(undefined);

  // Sync localOrder when lobby.playerOrder changes from the server
  useEffect(() => {
    setLocalOrder(lobby.playerOrder);
  }, [lobby.playerOrder]);

  const displayPlayers = localOrder
    .map((id) => playerMap.get(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  function handleDragStart(playerId: string) {
    dragSourceIdRef.current = playerId;
  }

  function handleDragOver(targetPlayerId: string) {
    const sourceId = dragSourceIdRef.current;
    if (!sourceId || sourceId === targetPlayerId) return;

    const sourceIndex = localOrder.indexOf(sourceId);
    const targetIndex = localOrder.indexOf(targetPlayerId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...localOrder];
    reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, sourceId);
    pendingOrderRef.current = reordered;
    setLocalOrder(reordered);
  }

  function handleDragEnd() {
    const finalOrder = pendingOrderRef.current ?? localOrder;
    pendingOrderRef.current = undefined;
    dragSourceIdRef.current = undefined;
    if (onReorderPlayers) {
      onReorderPlayers(finalOrder);
    }
  }

  const canReorder = !!onReorderPlayers && !disabled;

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
        {canReorder && displayPlayers.length > 1 && (
          <p className="text-xs text-muted-foreground mb-2">
            {PLAYER_LIST_COPY.dragHint}
          </p>
        )}
        <ul className="space-y-1">
          {displayPlayers.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              ownerPlayerId={lobby.ownerPlayerId}
              isCurrentUser={player.id === userPlayerId}
              isReady={readySet.has(player.id)}
              showLeave={showLeave}
              showRemovePlayer={showRemovePlayer}
              showMakeOwner={showMakeOwner}
              disabled={disabled}
              draggable={canReorder}
              onRemovePlayer={onRemovePlayer}
              onTransferOwner={onTransferOwner}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            />
          ))}
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
