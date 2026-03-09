"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getPlayerId, getLobbyId } from "@/lib/api";
import {
  useLobbyQuery,
  useLobbyWebSocket,
  useRemovePlayer,
  useStartGame,
  useTransferOwner,
  useConfigSync,
} from "@/hooks";
import JoinPrompt from "./JoinPrompt";
import PlayerList from "./PlayerList";
import GameConfigurationPanel from "./GameConfigurationPanel";

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // undefined = not yet read from localStorage (avoid SSR mismatch)
  const [storedLobbyId, setStoredLobbyId] = useState<string | null | undefined>(
    undefined,
  );
  useEffect(() => {
    setStoredLobbyId(getLobbyId());
  }, []);

  const hasDifferentLobby =
    storedLobbyId !== undefined &&
    storedLobbyId !== null &&
    storedLobbyId !== lobbyId;

  const { isConnected: wsConnected } = useLobbyWebSocket(lobbyId);

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
  const { flush: flushConfigSync } = useConfigSync(lobbyId, isOwner);

  function handleRefetch() {
    void fetchLobby.refetch();
  }

  if (storedLobbyId === undefined || hasDifferentLobby) return null;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>
      <p>
        Lobby: <a href={`/lobby/${lobbyId}`}>{lobbyId}</a>
      </p>

      {fetchLobby.isLoading && <p>Loading...</p>}

      {fetchLobby.error &&
        fetchLobby.error.message !== "404" &&
        fetchLobby.error.message !== "403" && (
          <div style={{ color: "red", marginBottom: "10px" }}>
            Error: {fetchLobby.error.message}
          </div>
        )}

      {!fetchLobby.isLoading && fetchLobby.data === null && (
        <JoinPrompt lobbyId={lobbyId} />
      )}

      {removeMutation.error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {removeMutation.error.message}
        </div>
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
