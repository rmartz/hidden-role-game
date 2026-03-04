"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLobby, removePlayer, getPlayerId } from "@/lib/api";

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: lobby,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["lobby", lobbyId],
    queryFn: async () => {
      const response = await getLobby(lobbyId);
      if (response.status === "error")
        throw new Error(response.error ?? "Failed to load lobby");
      return response.data;
    },
    refetchInterval: 30_000,
  });

  const myPlayerId = getPlayerId();
  const isOwner = !!lobby && lobby.ownerPlayerId === myPlayerId;
  const gameStarted = !!lobby?.game;

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

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Secret Villain Game</h1>
      <p>Lobby ID: {lobbyId}</p>

      {isLoading && <p>Loading...</p>}

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {error.message}
        </div>
      )}

      {removeMutation.error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {removeMutation.error.message}
        </div>
      )}

      {lobby && (
        <>
          <p>Players: {lobby.players.length}</p>
          <ul>
            {lobby.players.map((player) => (
              <li
                key={player.id}
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                {player.name}
                {player.id === myPlayerId && !gameStarted && (
                  <button
                    onClick={() => removeMutation.mutate(player.id)}
                    disabled={removeMutation.isPending}
                  >
                    Leave
                  </button>
                )}
                {isOwner && player.id !== myPlayerId && !gameStarted && (
                  <button
                    onClick={() => removeMutation.mutate(player.id)}
                    disabled={removeMutation.isPending}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
