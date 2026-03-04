"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getLobby } from "@/lib/api";

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();

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
