"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getLobby,
  removePlayer,
  joinLobby,
  getPlayerId,
  getLobbyId,
  clearSession,
} from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";
import LobbyConflictResolution from "../LobbyConflictResolution";

export default function LobbyConflictPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const router = useRouter();

  const storedLobbyId = getLobbyId();
  const myPlayerId = getPlayerId();

  const conflictLobbyQuery = useQuery({
    queryKey: ["conflict-lobby", storedLobbyId],
    queryFn: async () => {
      if (!storedLobbyId) return null;
      const { data, httpStatus } = await getLobby(storedLobbyId);
      if (httpStatus === 404 || httpStatus === 403) {
        clearSession();
        return null;
      }
      if (data.status === ServerResponseStatus.Error) return null;
      return data.data;
    },
    enabled: !!storedLobbyId,
  });

  const defaultName =
    conflictLobbyQuery.data?.players.find((p) => p.id === myPlayerId)?.name ??
    "";
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    if (defaultName && !playerName) {
      setPlayerName(defaultName);
    }
  }, [defaultName, playerName]);

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

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!storedLobbyId || !myPlayerId) return;
      await removePlayer(storedLobbyId, myPlayerId);
      clearSession();
      await joinLobby(lobbyId, playerName);
    },
    onSuccess: () => {
      router.replace(`/lobby/${lobbyId}`);
    },
  });

  if (
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
          joinMutation.mutate();
        }}
      />
    </div>
  );
}
