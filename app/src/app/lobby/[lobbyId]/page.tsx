"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLobby,
  removePlayer,
  transferOwner,
  startGame,
  getPlayerId,
} from "@/lib/api";
import type { RoleSlot } from "@/server/models";
import JoinPrompt from "./JoinPrompt";
import PlayerList from "./PlayerList";
import RoleConfig from "./RoleConfig";

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: lobby,
    error,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["lobby", lobbyId],
    queryFn: async () => {
      const response = await getLobby(lobbyId);
      if (response.status === "error") return null;
      return response.data;
    },
    refetchInterval: (query) => {
      if (!query.state.data) return false;
      if (query.state.data.gameId) return false;
      return 3_000;
    },
  });

  const myPlayerId = getPlayerId();
  const isOwner = !!lobby && lobby.ownerPlayerId === myPlayerId;
  const gameId = lobby?.gameId;

  useEffect(() => {
    if (gameId) router.push(`/game/${gameId}`);
  }, [gameId, router]);

  const removeMutation = useMutation({
    mutationFn: (targetPlayerId: string) =>
      removePlayer(lobbyId, targetPlayerId),
    onSuccess: (response, targetPlayerId) => {
      if (response.status === "error") return;
      if (targetPlayerId === myPlayerId) {
        router.push("/");
      } else {
        queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
      }
    },
  });

  const startGameMutation = useMutation({
    mutationFn: (roleSlots: RoleSlot[]) => startGame(lobbyId, roleSlots),
    onSuccess: (response) => {
      if (response.status === "error") return;
      queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    },
  });

  const transferOwnerMutation = useMutation({
    mutationFn: (targetPlayerId: string) =>
      transferOwner(lobbyId, targetPlayerId),
    onSuccess: (response) => {
      if (response.status === "error") return;
      queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    },
  });

  function handleRefetch() {
    refetch();
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Secret Villain Game</h1>
      <p>
        Lobby: <a href={`/lobby/${lobbyId}`}>{lobbyId}</a>
      </p>

      {isLoading && <p>Loading...</p>}

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {error.message}
        </div>
      )}

      {!isLoading && lobby === null && <JoinPrompt lobbyId={lobbyId} />}

      {removeMutation.error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {removeMutation.error.message}
        </div>
      )}

      {lobby && isOwner && !gameId && (
        <RoleConfig
          playerCount={lobby.players.length}
          disabled={startGameMutation.isPending}
          onStartGame={(roleSlots) => startGameMutation.mutate(roleSlots)}
        />
      )}

      {lobby && (
        <PlayerList
          lobby={lobby}
          userPlayerId={myPlayerId}
          showLeave={!isOwner}
          showRemovePlayer={isOwner}
          showMakeOwner={isOwner}
          isFetching={isFetching}
          disabled={
            removeMutation.isPending ||
            transferOwnerMutation.isPending ||
            startGameMutation.isPending ||
            gameId !== undefined
          }
          onRefetch={handleRefetch}
          onRemovePlayer={(playerId: string) => removeMutation.mutate(playerId)}
          onTransferOwner={(playerId: string) =>
            transferOwnerMutation.mutate(playerId)
          }
        />
      )}
    </div>
  );
}
