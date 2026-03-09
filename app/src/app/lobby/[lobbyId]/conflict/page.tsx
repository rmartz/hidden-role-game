"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlayerId, getLobbyId } from "@/lib/api";
import { useLeaveAndJoinLobby } from "@/hooks/leave-and-join-lobby";
import { useStoredLobbyQuery, useLobbyExistsQuery } from "@/hooks/lobby-query";
import LobbyConflictResolution from "../LobbyConflictResolution";

export default function LobbyConflictPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const router = useRouter();

  const storedLobbyId = getLobbyId();
  const myPlayerId = getPlayerId();

  const targetLobbyQuery = useLobbyExistsQuery(lobbyId);
  const conflictLobbyQuery = useStoredLobbyQuery(storedLobbyId);

  const defaultName =
    conflictLobbyQuery.data?.players.find((p) => p.id === myPlayerId)?.name ??
    "";
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    if (defaultName && !playerName) {
      setPlayerName(defaultName);
    }
  }, [defaultName, playerName]);

  // If the target lobby doesn't exist, redirect to the stored lobby (or home if none).
  useEffect(() => {
    if (!targetLobbyQuery.isLoading && targetLobbyQuery.data === false) {
      router.replace(storedLobbyId ? `/lobby/${storedLobbyId}` : "/");
    }
  }, [
    targetLobbyQuery.isLoading,
    targetLobbyQuery.data,
    storedLobbyId,
    router,
  ]);

  // If there's no stored lobby ID, there's nothing to conflict with — go back to the lobby.
  useEffect(() => {
    if (!storedLobbyId) {
      router.replace(`/lobby/${lobbyId}`);
    }
  }, [storedLobbyId, lobbyId, router]);

  // If the stored lobby no longer exists (cleared in queryFn on 404/403), go back to the lobby.
  useEffect(() => {
    if (!conflictLobbyQuery.isLoading && conflictLobbyQuery.data === null) {
      router.replace(`/lobby/${lobbyId}`);
    }
  }, [conflictLobbyQuery.isLoading, conflictLobbyQuery.data, lobbyId, router]);

  const joinMutation = useLeaveAndJoinLobby(() => {
    router.replace(`/lobby/${lobbyId}`);
  });

  if (
    targetLobbyQuery.isLoading ||
    conflictLobbyQuery.isLoading ||
    !conflictLobbyQuery.data ||
    !storedLobbyId
  ) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>
      <LobbyConflictResolution
        conflictLobby={conflictLobbyQuery.data}
        conflictLobbyId={storedLobbyId}
        playerName={playerName}
        onPlayerNameChange={setPlayerName}
        isJoining={joinMutation.isPending}
        onJoin={() => {
          if (!storedLobbyId || !myPlayerId) return;
          joinMutation.mutate({
            storedLobbyId,
            myPlayerId,
            lobbyId,
            playerName,
          });
        }}
      />
    </div>
  );
}
