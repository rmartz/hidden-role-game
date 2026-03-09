"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLobbyId, getPlayerId } from "@/lib/api";
import { useCreateLobby, useJoinLobby, useStoredLobbyQuery } from "@/hooks";

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [lobbyIdInput, setLobbyIdInput] = useState("");

  const createMutation = useCreateLobby();
  const joinMutation = useJoinLobby((data) => {
    router.push(`/lobby/${data.lobby.id}`);
  });

  const storedLobbyId = getLobbyId();
  const myPlayerId = getPlayerId();

  const storedLobbyQuery = useStoredLobbyQuery(storedLobbyId);

  const storedPlayerName =
    storedLobbyQuery.data?.players.find((p) => p.id === myPlayerId)?.name ?? "";

  useEffect(() => {
    if (storedPlayerName && !playerName) {
      setPlayerName(storedPlayerName);
    }
  }, [storedPlayerName, playerName]);

  const error = createMutation.error?.message ?? joinMutation.error?.message;
  const loading = createMutation.isPending || joinMutation.isPending;
  // Hide the active lobby panel once a create/join is in progress to avoid
  // it flashing into view after localStorage is written but before navigation.
  const activeLobby =
    loading || createMutation.isSuccess || joinMutation.isSuccess
      ? null
      : storedLobbyQuery.data;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>

      {activeLobby && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        >
          {activeLobby.gameId ? (
            <>
              <p>You have an active game in progress.</p>
              <button
                onClick={() => {
                  const { gameId } = activeLobby;
                  if (gameId) router.push(`/game/${gameId}`);
                }}
              >
                Rejoin Game
              </button>
            </>
          ) : (
            <>
              <p>You are already in lobby: {storedLobbyId}</p>
              <button
                onClick={() => {
                  if (storedLobbyId) router.push(`/lobby/${storedLobbyId}`);
                }}
              >
                Rejoin Lobby
              </button>
            </>
          )}
        </div>
      )}

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
            createMutation.mutate(playerName);
          }}
          disabled={loading || playerName.trim() === ""}
        >
          {createMutation.isPending ? "Creating..." : "Create Lobby"}
        </button>
        <button
          onClick={() => {
            joinMutation.mutate({ lobbyId: lobbyIdInput, playerName });
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
