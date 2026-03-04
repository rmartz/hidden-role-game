"use client";

import { useState } from "react";
import { createLobby, joinLobby } from "@/lib/api";
import type { PublicLobbyPlayer } from "@/lib/api";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [lobbyIdInput, setLobbyIdInput] = useState("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [gamePlayers, setGamePlayers] = useState<PublicLobbyPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateGame = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await createLobby(playerName);
      if (response.status === "success") {
        setGameId(response.data.lobby.id);
        setGamePlayers(response.data.lobby.players);
      } else {
        setError(response.error || "Failed to create lobby");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!lobbyIdInput.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const response = await joinLobby(lobbyIdInput, playerName);
      if (response.status === "success") {
        setGameId(response.data.lobby.id);
        setGamePlayers(response.data.lobby.players);
      } else {
        setError(response.error || "Failed to join lobby");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Secret Villain Game</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>Error: {error}</div>
      )}

      {!gameId ? (
        <div>
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
          <div style={{ marginBottom: "10px" }}>
            <label>
              Lobby ID:{" "}
              <input
                type="text"
                value={lobbyIdInput}
                onChange={(e) => setLobbyIdInput(e.target.value)}
                placeholder="Leave blank to create a new lobby"
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleCreateGame}
              disabled={loading || playerName.trim() === ""}
            >
              {loading ? "Creating..." : "Create Lobby"}
            </button>
            <button
              onClick={handleJoinGame}
              disabled={
                loading ||
                playerName.trim() === "" ||
                lobbyIdInput.trim() === ""
              }
            >
              {loading ? "Joining..." : "Join Lobby"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>Lobby ID: {gameId}</p>
          <p>Players: {gamePlayers.length}</p>
          <ul>
            {gamePlayers.map((player) => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
