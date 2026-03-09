"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJoinLobby } from "@/hooks/join-lobby";

interface Props {
  lobbyId: string;
}

export default function JoinPrompt({ lobbyId }: Props) {
  const queryClient = useQueryClient();
  const [playerName, setPlayerName] = useState("");

  const joinMutation = useJoinLobby(() => {
    void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
  });

  function handleJoin() {
    joinMutation.mutate({ lobbyId, playerName });
  }

  return (
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
            onChange={(e) => {
              setPlayerName(e.target.value);
            }}
            placeholder="Enter your name"
          />
        </label>
      </div>
      <button
        onClick={handleJoin}
        disabled={joinMutation.isPending || playerName.trim() === ""}
      >
        {joinMutation.isPending ? "Joining..." : "Join Lobby"}
      </button>
    </div>
  );
}
