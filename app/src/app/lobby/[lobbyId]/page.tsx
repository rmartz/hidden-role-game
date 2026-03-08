"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLobby,
  removePlayer,
  transferOwner,
  startGame,
  updateLobbyConfig,
  getPlayerId,
  getLobbyId,
} from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";
import type { GameMode } from "@/lib/models";
import type { RoleSlot } from "@/server/models";
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

  const fetchLobby = useQuery({
    queryKey: ["lobby", lobbyId],
    queryFn: async () => {
      const { data, httpStatus } = await getLobby(lobbyId);
      if (httpStatus === 404 || httpStatus === 403)
        throw new Error(String(httpStatus));
      if (data.status === ServerResponseStatus.Error) return null;
      return data.data;
    },
    refetchInterval: (query) => {
      if (!query.state.data) return false;
      if (query.state.data.gameId) return false;
      return 3_000;
    },
    enabled: storedLobbyId !== undefined && !hasDifferentLobby,
    retry: false,
  });

  const myPlayerId = getPlayerId();
  const isOwner =
    !!fetchLobby.data && fetchLobby.data.ownerPlayerId === myPlayerId;
  const gameId = fetchLobby.data?.gameId;

  useEffect(() => {
    if (hasDifferentLobby) router.replace(`/lobby/${lobbyId}/conflict`);
  }, [hasDifferentLobby, lobbyId, router]);

  useEffect(() => {
    if (gameId) router.push(`/game/${gameId}`);
  }, [gameId, router]);

  useEffect(() => {
    if (
      fetchLobby.error?.message === "404" ||
      fetchLobby.error?.message === "403"
    ) {
      router.push("/");
    }
  }, [fetchLobby.error, router]);

  const removeMutation = useMutation({
    mutationFn: (targetPlayerId: string) =>
      removePlayer(lobbyId, targetPlayerId),
    onSuccess: (response, targetPlayerId) => {
      if (response.status === ServerResponseStatus.Error) return;
      if (targetPlayerId === myPlayerId) {
        router.push("/");
      } else {
        void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
      }
    },
  });

  const startGameMutation = useMutation({
    mutationFn: ({
      roleSlots,
      gameMode,
    }: {
      roleSlots: RoleSlot[];
      gameMode: GameMode;
    }) => startGame(lobbyId, roleSlots, gameMode),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    },
  });

  const transferOwnerMutation = useMutation({
    mutationFn: (targetPlayerId: string) =>
      transferOwner(lobbyId, targetPlayerId),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (config: Parameters<typeof updateLobbyConfig>[1]) =>
      updateLobbyConfig(lobbyId, config),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      queryClient.setQueryData(["lobby", lobbyId], response.data.lobby);
    },
  });

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
            isPending={
              updateConfigMutation.isPending || startGameMutation.isPending
            }
            onConfigChange={(config) => {
              updateConfigMutation.mutate(config);
            }}
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
          disabled={
            removeMutation.isPending ||
            transferOwnerMutation.isPending ||
            startGameMutation.isPending ||
            gameId !== undefined
          }
          onRefetch={handleRefetch}
          onRemovePlayer={(playerId: string) => {
            removeMutation.mutate(playerId);
          }}
          onTransferOwner={(playerId: string) => {
            transferOwnerMutation.mutate(playerId);
          }}
        />
      )}
    </div>
  );
}
