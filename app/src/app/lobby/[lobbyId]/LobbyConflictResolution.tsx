"use client";

import { useRouter } from "next/navigation";
import type { PublicLobby } from "@/server/models";

interface LobbyConflictResolutionProps {
  conflictLobby: PublicLobby;
  conflictLobbyId: string;
  isLeaving: boolean;
  onLeave: () => void;
}

export default function LobbyConflictResolution({
  conflictLobby,
  conflictLobbyId,
  isLeaving,
  onLeave,
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
          {conflictLobby.gameId ? "Rejoin Game" : "Rejoin Previous Lobby"}
        </button>
        <button onClick={onLeave} disabled={isLeaving}>
          {isLeaving ? "Leaving..." : "Leave Previous Lobby and Stay Here"}
        </button>
      </div>
    </div>
  );
}
