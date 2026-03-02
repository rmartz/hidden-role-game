import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ApiClient } from "./api/client";
import type { components } from "./api/types";

const api = new ApiClient();

const App = () => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gamePlayers, setGamePlayers] = useState<
    components["schemas"]["Player"][]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateGame = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.createGame();
      if (response.status === "success") {
        setGameId(response.data.id);
        setGamePlayers(response.data.players);
      } else {
        setError(response.error || "Failed to create game");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      setError(null);
      const playerName = `Player ${gamePlayers.length + 1}`;
      const response = await api.joinGame(gameId, playerName);
      if (response.status === "success") {
        setGamePlayers(response.data.players);
      } else {
        setError(response.error || "Failed to join game");
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
      <p>Frontend with type-safe API client generated from OpenAPI spec</p>

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>Error: {error}</div>
      )}

      {!gameId ? (
        <button onClick={handleCreateGame} disabled={loading}>
          {loading ? "Creating..." : "Create Game"}
        </button>
      ) : (
        <div>
          <p>Game ID: {gameId}</p>
          <p>Players: {gamePlayers.length}</p>
          <ul>
            {gamePlayers.map((player) => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
          <button onClick={handleJoinGame} disabled={loading}>
            {loading ? "Joining..." : "Join Game"}
          </button>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
