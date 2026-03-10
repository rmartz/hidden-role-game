"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getPlayerId, getLobbyId, getSessionId } from "@/lib/api";
import {
  useLobbyQuery,
  useLobbyWebSocket,
  useRemovePlayer,
  useStartGame,
  useTransferOwner,
  useConfigSync,
} from "@/hooks";
import {
  GameConfigurationPanel,
  JoinPrompt,
  PlayerList,
} from "@/components/lobby";

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // undefined = not yet read from localStorage (avoid SSR mismatch)
  const [storedLobbyId, setStoredLobbyId] = useState<string | null | undefined>(
    undefined,
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    setStoredLobbyId(getLobbyId());
    setSessionId(getSessionId());
  }, []);

  const hasDifferentLobby =
    storedLobbyId !== undefined &&
    storedLobbyId !== null &&
    storedLobbyId !== lobbyId;

  const { isConnected: wsConnected } = useLobbyWebSocket(lobbyId, sessionId);

  const fetchLobby = useLobbyQuery(lobbyId, {
    enabled: storedLobbyId !== undefined && !hasDifferentLobby,
    disablePolling: wsConnected,
  });

  const myPlayerId = getPlayerId();
  const isOwner =
    !!fetchLobby.data && fetchLobby.data.ownerPlayerId === myPlayerId;
  const gameId = fetchLobby.data?.gameId;

  // If the user has a session for a different lobby, send them to the conflict resolution page.
  useEffect(() => {
    if (hasDifferentLobby) router.replace(`/lobby/${lobbyId}/conflict`);
  }, [hasDifferentLobby, lobbyId, router]);

  // Once the game starts, redirect all players to the game page.
  useEffect(() => {
    if (gameId) router.push(`/game/${gameId}`);
  }, [gameId, router]);

  // If the lobby doesn't exist or the session is invalid, return to the home page.
  useEffect(() => {
    if (
      fetchLobby.error?.message === "404" ||
      fetchLobby.error?.message === "403"
    ) {
      router.push("/");
    }
  }, [fetchLobby.error, router]);

  const removeMutation = useRemovePlayer(lobbyId, (targetPlayerId) => {
    if (targetPlayerId === myPlayerId) {
      router.push("/");
    } else {
      void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    }
  });

  const startGameMutation = useStartGame(lobbyId);
  const transferOwnerMutation = useTransferOwner(lobbyId);
  const { flush: flushConfigSync } = useConfigSync(
    lobbyId,
    isOwner,
    wsConnected,
  );

  function handleRefetch() {
    void fetchLobby.refetch();
  }

  if (storedLobbyId === undefined || hasDifferentLobby) return null;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-2">Hidden Role Game</h1>
      <p className="mb-4 text-muted-foreground">
        Lobby:{" "}
        <a href={`/lobby/${lobbyId}`} className="underline">
          {lobbyId}
        </a>
      </p>

      {fetchLobby.isLoading && (
        <p className="text-muted-foreground">Loading...</p>
      )}

      {fetchLobby.error &&
        fetchLobby.error.message !== "404" &&
        fetchLobby.error.message !== "403" && (
          <p className="text-destructive text-sm mb-3">
            Error: {fetchLobby.error.message}
          </p>
        )}

      {!fetchLobby.isLoading && fetchLobby.data === null && (
        <JoinPrompt
          lobbyId={lobbyId}
          onJoined={() => {
            setSessionId(getSessionId());
          }}
        />
      )}

      {removeMutation.error && (
        <p className="text-destructive text-sm mb-3">
          Error: {removeMutation.error.message}
        </p>
      )}

      {fetchLobby.data &&
        !gameId &&
        (isOwner || fetchLobby.data.config.showConfigToPlayers) &&
        (isOwner ? (
          <GameConfigurationPanel
            config={fetchLobby.data.config}
            playerCount={fetchLobby.data.players.length}
            readOnly={false}
            isPending={startGameMutation.isPending}
            onStartGame={(roleSlots, gameMode) => {
              startGameMutation.mutate({ roleSlots, gameMode });
            }}
          />
        ) : (
          <GameConfigurationPanel
            config={fetchLobby.data.config}
            playerCount={fetchLobby.data.players.length}
            readOnly={true}
          />
        ))}

      {fetchLobby.data && (
        <PlayerList
          lobby={fetchLobby.data}
          userPlayerId={myPlayerId}
          showLeave={!isOwner}
          showRemovePlayer={isOwner}
          showMakeOwner={isOwner}
          showRefresh={!wsConnected}
          isFetching={fetchLobby.isFetching}
          disabled={startGameMutation.isPending || gameId !== undefined}
          onRefetch={handleRefetch}
          onRemovePlayer={(playerId: string) => {
            removeMutation.mutate(playerId);
          }}
          onTransferOwner={(playerId: string) => {
            flushConfigSync();
            transferOwnerMutation.mutate(playerId);
          }}
        />
      )}
    </div>
  );
}
