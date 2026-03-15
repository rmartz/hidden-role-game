"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlayerId, getLobbyId } from "@/lib/api";
import { getPlayerName } from "@/lib/player-utils";
import {
  useLeaveAndJoinLobby,
  useStoredLobbyQuery,
  useLobbyExistsQuery,
} from "@/hooks";
import { LobbyConflictResolution } from "@/components/lobby";

export default function LobbyConflictPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const router = useRouter();

  const storedLobbyId = getLobbyId();
  const myPlayerId = getPlayerId();

  const targetLobbyQuery = useLobbyExistsQuery(lobbyId);
  const conflictLobbyQuery = useStoredLobbyQuery(storedLobbyId);

  const defaultName =
    getPlayerName(conflictLobbyQuery.data?.players, myPlayerId) ?? "";
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

  function handleJoin() {
    if (!storedLobbyId || !myPlayerId) return;
    joinMutation.mutate({ storedLobbyId, myPlayerId, lobbyId, playerName });
  }

  if (
    targetLobbyQuery.isLoading ||
    conflictLobbyQuery.isLoading ||
    !conflictLobbyQuery.data ||
    !storedLobbyId
  ) {
    return <p className="p-5 text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Hidden Role Game</h1>
      <LobbyConflictResolution
        conflictLobby={conflictLobbyQuery.data}
        conflictLobbyId={storedLobbyId}
        playerName={playerName}
        onPlayerNameChange={setPlayerName}
        isJoining={joinMutation.isPending}
        onJoin={handleJoin}
      />
    </div>
  );
}
