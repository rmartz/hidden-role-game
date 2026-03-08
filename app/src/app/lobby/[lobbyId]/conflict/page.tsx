"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getLobby,
  removePlayer,
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

  useEffect(() => {
    if (!storedLobbyId) {
      router.replace(`/lobby/${lobbyId}`);
    }
  }, [storedLobbyId, lobbyId, router]);

  useEffect(() => {
    if (!conflictLobbyQuery.isLoading && conflictLobbyQuery.data === null) {
      router.replace(`/lobby/${lobbyId}`);
    }
  }, [conflictLobbyQuery.isLoading, conflictLobbyQuery.data, lobbyId, router]);

  const leavePreviousMutation = useMutation({
    mutationFn: async () => {
      if (!storedLobbyId || !myPlayerId) return;
      await removePlayer(storedLobbyId, myPlayerId);
      clearSession();
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
        isLeaving={leavePreviousMutation.isPending}
        onLeave={() => {
          leavePreviousMutation.mutate();
        }}
      />
    </div>
  );
}
