"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLobby, joinLobby, removePlayer, getPlayerId } from "@/lib/api";

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [playerName, setPlayerName] = useState("");

  const {
    data: lobby,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["lobby", lobbyId],
    queryFn: async () => {
      const response = await getLobby(lobbyId);
      if (response.status === "error") return null;
      return response.data;
    },
    refetchInterval: (query) => (query.state.data ? 30_000 : false),
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const response = await joinLobby(lobbyId, playerName);
      if (response.status === "error")
        throw new Error(response.error ?? "Failed to join lobby");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    },
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
      <p>
        Lobby: <a href={`/lobby/${lobbyId}`}>{lobbyId}</a>
      </p>

      {isLoading && <p>Loading...</p>}

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {error.message}
        </div>
      )}

      {!isLoading && lobby === null && (
        <div>
          <p>Enter your name to join this lobby.</p>
          {joinMutation.error && (
            <div style={{ color: "red", marginBottom: "10px" }}>
              Error: {joinMutation.error.message}
            </div>
          )}
          <div style={{ marginBottom: "10px" }}>
            <label>
              Your name:{" "}
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
              />
            </label>
          </div>
          <button
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending || playerName.trim() === ""}
          >
            {joinMutation.isPending ? "Joining..." : "Join Lobby"}
          </button>
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
                    onClick={() => {
                      if (window.confirm("Leave this lobby?"))
                        removeMutation.mutate(player.id);
                    }}
                    disabled={removeMutation.isPending}
                  >
                    Leave
                  </button>
                )}
                {isOwner && player.id !== myPlayerId && !gameStarted && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(`Remove ${player.name} from the lobby?`)
                      )
                        removeMutation.mutate(player.id);
                    }}
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
