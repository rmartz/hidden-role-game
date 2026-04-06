"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlayerId, getLobbyId } from "@/lib/api";
import { getPlayerName } from "@/lib/player";
import { parseGameMode } from "@/lib/game/modes";
import {
  useLeaveAndJoinLobby,
  useStoredLobbyQuery,
  useLobbyExistsQuery,
} from "@/hooks";
import { LobbyConflictResolution } from "@/components/lobby";
import { LOBBY_CONFLICT_PAGE_COPY } from "./page.copy";

export default function LobbyConflictPage() {
  const { lobbyId, gameMode: gameModeParam } = useParams<{
    lobbyId: string;
    gameMode: string;
  }>();
  const router = useRouter();

  const validatedGameMode = parseGameMode(gameModeParam);

  const storedLobbyId = getLobbyId();
  const myPlayerId = getPlayerId();

  const targetLobbyQuery = useLobbyExistsQuery(lobbyId);
  const conflictLobbyQuery = useStoredLobbyQuery(storedLobbyId);

  const defaultName =
    getPlayerName(conflictLobbyQuery.data?.players, myPlayerId) ?? "";
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    if (!validatedGameMode) router.push("/");
  }, [validatedGameMode, router]);

  useEffect(() => {
    if (defaultName && !playerName) {
      setPlayerName(defaultName);
    }
  }, [defaultName, playerName]);

  // If the target lobby doesn't exist, redirect to the stored lobby (or home if none).
  useEffect(() => {
    if (!targetLobbyQuery.isLoading && targetLobbyQuery.data === false) {
      const resolvedGameMode =
        conflictLobbyQuery.data?.config.gameMode ?? validatedGameMode;
      const fallback =
        storedLobbyId && resolvedGameMode
          ? `/${resolvedGameMode}/lobby/${storedLobbyId}`
          : "/";
      router.replace(fallback);
    }
  }, [
    targetLobbyQuery.isLoading,
    targetLobbyQuery.data,
    storedLobbyId,
    conflictLobbyQuery.data,
    validatedGameMode,
    router,
  ]);

  // If there's no stored lobby ID, there's nothing to conflict with — go back to the lobby.
  useEffect(() => {
    if (!storedLobbyId && validatedGameMode) {
      router.replace(`/${validatedGameMode}/lobby/${lobbyId}`);
    }
  }, [storedLobbyId, lobbyId, validatedGameMode, router]);

  // If the stored lobby no longer exists (cleared in queryFn on 404/403), go back to the lobby.
  useEffect(() => {
    if (
      !conflictLobbyQuery.isLoading &&
      conflictLobbyQuery.data === null &&
      validatedGameMode
    ) {
      router.replace(`/${validatedGameMode}/lobby/${lobbyId}`);
    }
  }, [
    conflictLobbyQuery.isLoading,
    conflictLobbyQuery.data,
    lobbyId,
    validatedGameMode,
    router,
  ]);

  function onJoinSuccess() {
    if (validatedGameMode)
      router.replace(`/${validatedGameMode}/lobby/${lobbyId}`);
  }
  const joinMutation = useLeaveAndJoinLobby(onJoinSuccess);

  function handleJoin() {
    if (!storedLobbyId || !myPlayerId) return;
    joinMutation.mutate({ storedLobbyId, myPlayerId, lobbyId, playerName });
  }

  if (!validatedGameMode) return null;

  return targetLobbyQuery.isLoading ||
    conflictLobbyQuery.isLoading ||
    !conflictLobbyQuery.data ||
    !storedLobbyId ? (
    <p className="p-5 text-muted-foreground">
      {LOBBY_CONFLICT_PAGE_COPY.loading}
    </p>
  ) : (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {LOBBY_CONFLICT_PAGE_COPY.title}
      </h1>
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
