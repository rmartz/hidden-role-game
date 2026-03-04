"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getLobby } from "@/lib/api";
import type { PublicLobbyPlayer } from "@/lib/api";

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const [players, setPlayers] = useState<PublicLobbyPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLobby() {
      try {
        const response = await getLobby(lobbyId);
        if (response.status === "success") {
          setPlayers(response.data.players);
        } else {
          setError(response.error || "Failed to load lobby");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchLobby();
  }, [lobbyId]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Secret Villain Game</h1>
      <p>Lobby ID: {lobbyId}</p>

      {loading && <p>Loading...</p>}

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>Error: {error}</div>
      )}

      {!loading && !error && (
        <>
          <p>Players: {players.length}</p>
          <ul>
            {players.map((player) => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
