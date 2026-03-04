"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLobby, joinLobby } from "@/lib/api";

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
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

      {lobby && (
        <>
          <p>Players: {lobby.players.length}</p>
          <ul>
            {lobby.players.map((player) => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
