"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createLobby, joinLobby } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [lobbyIdInput, setLobbyIdInput] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await createLobby(playerName);
      if (response.status === ServerResponseStatus.Error)
        throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      router.push(`/lobby/${data.lobby.id}`);
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const response = await joinLobby(lobbyIdInput, playerName);
      if (response.status === ServerResponseStatus.Error)
        throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      router.push(`/lobby/${data.lobby.id}`);
    },
  });

  const error = createMutation.error?.message ?? joinMutation.error?.message;
  const loading = createMutation.isPending || joinMutation.isPending;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>Error: {error}</div>
      )}

      <div style={{ marginBottom: "10px" }}>
        <label>
          Your name:{" "}
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
            }}
            placeholder="Enter your name"
          />
        </label>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Lobby ID:{" "}
          <input
            type="text"
            value={lobbyIdInput}
            onChange={(e) => {
              setLobbyIdInput(e.target.value);
            }}
            placeholder="Leave blank to create a new lobby"
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => {
            createMutation.mutate();
          }}
          disabled={loading || playerName.trim() === ""}
        >
          {createMutation.isPending ? "Creating..." : "Create Lobby"}
        </button>
        <button
          onClick={() => {
            joinMutation.mutate();
          }}
          disabled={
            loading || playerName.trim() === "" || lobbyIdInput.trim() === ""
          }
        >
          {joinMutation.isPending ? "Joining..." : "Join Lobby"}
        </button>
      </div>
    </div>
  );
}
