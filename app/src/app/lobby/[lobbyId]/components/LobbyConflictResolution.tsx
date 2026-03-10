"use client";

import { useRouter } from "next/navigation";
import type { PublicLobby } from "@/server/models";

interface LobbyConflictResolutionProps {
  conflictLobby: PublicLobby;
  conflictLobbyId: string;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  isJoining: boolean;
  onJoin: () => void;
}

export function LobbyConflictResolution({
  conflictLobby,
  conflictLobbyId,
  playerName,
  onPlayerNameChange,
  isJoining,
  onJoin,
}: LobbyConflictResolutionProps) {
  const router = useRouter();

  return (
    <div
      style={{
        marginBottom: "20px",
        padding: "10px",
        border: "1px solid #ccc",
      }}
    >
      {conflictLobby.gameId ? (
        <p>You have an active game in lobby {conflictLobbyId}.</p>
      ) : (
        <p>You are already in lobby {conflictLobbyId}.</p>
      )}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => {
            const { gameId } = conflictLobby;
            if (gameId) {
              router.push(`/game/${gameId}`);
            } else {
              router.push(`/lobby/${conflictLobbyId}`);
            }
          }}
        >
          {conflictLobby.gameId ? "Rejoin Game" : "Stay In Previous Lobby"}
        </button>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              onPlayerNameChange(e.target.value);
            }}
            placeholder="Your name"
            disabled={isJoining}
          />
          <button
            onClick={onJoin}
            disabled={isJoining || playerName.trim() === ""}
          >
            {isJoining ? "Joining..." : "Leave and Join This Lobby"}
          </button>
        </div>
      </div>
    </div>
  );
}
