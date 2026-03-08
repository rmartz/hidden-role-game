"use client";

import { useEffect } from "react";
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
  clearSession,
} from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";
import type { GameMode } from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import JoinPrompt from "./JoinPrompt";
import PlayerList from "./PlayerList";
import GameConfigurationPanel from "./GameConfigurationPanel";
import LobbyConflictResolution from "./LobbyConflictResolution";

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const storedLobbyId = getLobbyId();
  const hasDifferentLobby = storedLobbyId !== null && storedLobbyId !== lobbyId;

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
    retry: false,
  });

  const conflictLobbyQuery = useQuery({
    queryKey: ["conflict-lobby", storedLobbyId],
    queryFn: async () => {
      if (!storedLobbyId) return null;
      const { data, httpStatus } = await getLobby(storedLobbyId);
      if (httpStatus === 404 || httpStatus === 403) {
        clearSession();
        return null;
      }
      if (data.status === ServerResponseStatus.Error) return null;
      return data.data;
    },
    enabled: hasDifferentLobby,
  });

  const myPlayerId = getPlayerId();
  const isOwner =
    !!fetchLobby.data && fetchLobby.data.ownerPlayerId === myPlayerId;
  const gameId = fetchLobby.data?.gameId;
  const conflictLobby = conflictLobbyQuery.data ?? null;

  useEffect(() => {
    if (gameId) router.push(`/game/${gameId}`);
  }, [gameId, router]);

  useEffect(() => {
    if (fetchLobby.error?.message === "404") {
      router.push("/");
    }
    if (fetchLobby.error?.message === "403" && !hasDifferentLobby) {
      router.push("/");
    }
  }, [fetchLobby.error, router, hasDifferentLobby]);

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

  const leavePreviousMutation = useMutation({
    mutationFn: async () => {
      if (!storedLobbyId || !myPlayerId) return;
      await removePlayer(storedLobbyId, myPlayerId);
      clearSession();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["conflict-lobby", storedLobbyId],
      });
      void fetchLobby.refetch();
    },
  });

  function handleRefetch() {
    void fetchLobby.refetch();
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>
      <p>
        Lobby: <a href={`/lobby/${lobbyId}`}>{lobbyId}</a>
      </p>

      {conflictLobby && storedLobbyId && (
        <LobbyConflictResolution
          conflictLobby={conflictLobby}
          conflictLobbyId={storedLobbyId}
          isLeaving={leavePreviousMutation.isPending}
          onLeave={() => {
            leavePreviousMutation.mutate();
          }}
        />
      )}

      {fetchLobby.isLoading && <p>Loading...</p>}

      {fetchLobby.error &&
        fetchLobby.error.message !== "404" &&
        fetchLobby.error.message !== "403" && (
          <div style={{ color: "red", marginBottom: "10px" }}>
            Error: {fetchLobby.error.message}
          </div>
        )}

      {!fetchLobby.isLoading && fetchLobby.data === null && !conflictLobby && (
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
