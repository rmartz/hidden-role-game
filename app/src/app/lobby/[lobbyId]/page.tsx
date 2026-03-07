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
} from "@/lib/api";
import { GameMode } from "@/lib/models";
import { GAME_MODE_ROLES, GAME_MODE_NAMES } from "@/lib/game-modes";
import type { RoleSlot } from "@/server/models";
import JoinPrompt from "./JoinPrompt";
import PlayerList from "./PlayerList";
import RoleConfig from "./RoleConfig";

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(
    GameMode.SecretVillain,
  );

  const {
    data: lobby,
    error,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["lobby", lobbyId],
    queryFn: async () => {
      const { data, httpStatus } = await getLobby(lobbyId);
      if (httpStatus === 404 || httpStatus === 403)
        throw new Error(`${httpStatus}`);
      if (data.status === "error") return null;
      return data.data;
    },
    refetchInterval: (query) => {
      if (!query.state.data) return false;
      if (query.state.data.gameId) return false;
      return 3_000;
    },
    retry: false,
  });

  const myPlayerId = getPlayerId();
  const isOwner = !!lobby && lobby.ownerPlayerId === myPlayerId;
  const gameId = lobby?.gameId;

  useEffect(() => {
    if (gameId) router.push(`/game/${gameId}`);
  }, [gameId, router]);

  useEffect(() => {
    if (error?.message === "404" || error?.message === "403") {
      router.push("/");
    }
  }, [error, router]);

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
    mutationFn: (roleSlots: RoleSlot[]) =>
      startGame(lobbyId, roleSlots, selectedGameMode),
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

  const updateConfigMutation = useMutation({
    mutationFn: (config: Parameters<typeof updateLobbyConfig>[1]) =>
      updateLobbyConfig(lobbyId, config),
    onSuccess: (response) => {
      if (response.status === "error") return;
      queryClient.setQueryData(["lobby", lobbyId], response.data.lobby);
    },
  });

  function handleRefetch() {
    refetch();
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>
      <p>
        Lobby: <a href={`/lobby/${lobbyId}`}>{lobbyId}</a>
      </p>

      {isLoading && <p>Loading...</p>}

      {error && error.message !== "404" && error.message !== "403" && (
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

      {lobby && !gameId && (isOwner || lobby.config.showConfigToPlayers) && (
        <div style={{ marginTop: "20px" }}>
          {isOwner ? (
            <label>
              Game Mode:{" "}
              <select
                value={selectedGameMode}
                onChange={(e) =>
                  setSelectedGameMode(e.target.value as GameMode)
                }
              >
                {Object.values(GameMode).map((mode) => (
                  <option key={mode} value={mode}>
                    {GAME_MODE_NAMES[mode]}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p>Game Mode: {GAME_MODE_NAMES[lobby.config.gameMode]}</p>
          )}
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={lobby.config.showConfigToPlayers}
                disabled={!isOwner || updateConfigMutation.isPending}
                onChange={(e) =>
                  updateConfigMutation.mutate({
                    showConfigToPlayers: e.target.checked,
                  })
                }
              />{" "}
              Show game configuration to all players
            </label>
            <label>
              <input
                type="checkbox"
                checked={lobby.config.showRolesInPlay}
                disabled={!isOwner || updateConfigMutation.isPending}
                onChange={(e) =>
                  updateConfigMutation.mutate({
                    showRolesInPlay: e.target.checked,
                  })
                }
              />{" "}
              Show roles in play when game starts
            </label>
          </div>
        </div>
      )}

      {lobby && isOwner && !gameId && (
        <RoleConfig
          key={selectedGameMode}
          playerCount={lobby.players.length}
          roleDefinitions={GAME_MODE_ROLES[selectedGameMode]}
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
