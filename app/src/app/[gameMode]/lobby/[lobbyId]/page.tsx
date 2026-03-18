"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getPlayerId, getLobbyId, getSessionId } from "@/lib/api";
import { parseGameMode } from "@/lib/game-modes";
import {
  useLobbyQuery,
  useLobbyWebSocket,
  useRemovePlayer,
  useStartGame,
  useTransferOwner,
  useConfigSync,
} from "@/hooks";
import {
  GameConfigurationPanel,
  JoinPrompt,
  PlayerList,
  ShareLobby,
} from "@/components/lobby";
import { LOBBY_PAGE_COPY } from "../copy";

export default function LobbyPage() {
  const { lobbyId, gameMode: gameModeParam } = useParams<{
    lobbyId: string;
    gameMode: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const validatedGameMode = parseGameMode(gameModeParam);

  // undefined = not yet read from localStorage (avoid SSR mismatch)
  const [storedLobbyId, setStoredLobbyId] = useState<string | undefined>(
    undefined,
  );
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  useEffect(() => {
    setStoredLobbyId(getLobbyId());
    setSessionId(getSessionId());
  }, []);

  const hasDifferentLobby =
    storedLobbyId !== undefined && storedLobbyId !== lobbyId;

  const { isConnected: wsConnected } = useLobbyWebSocket(lobbyId, sessionId);

  const fetchLobby = useLobbyQuery(lobbyId, {
    enabled: storedLobbyId !== undefined && !hasDifferentLobby,
    disablePolling: wsConnected,
  });

  const myPlayerId = getPlayerId();
  const isOwner =
    !!fetchLobby.data && fetchLobby.data.ownerPlayerId === myPlayerId;
  const gameId = fetchLobby.data?.gameId;
  const actualGameMode = fetchLobby.data?.config.gameMode;

  useEffect(() => {
    if (!validatedGameMode) router.push("/");
  }, [validatedGameMode, router]);

  // If the user has a session for a different lobby, send them to the conflict resolution page.
  useEffect(() => {
    if (hasDifferentLobby && validatedGameMode)
      router.replace(`/${validatedGameMode}/lobby/${lobbyId}/conflict`);
  }, [hasDifferentLobby, lobbyId, validatedGameMode, router]);

  // If the actual game mode doesn't match the URL, redirect to the correct URL.
  useEffect(() => {
    if (
      actualGameMode &&
      validatedGameMode &&
      actualGameMode !== validatedGameMode
    ) {
      router.replace(`/${actualGameMode}/lobby/${lobbyId}`);
    }
  }, [actualGameMode, validatedGameMode, lobbyId, router]);

  // Once the game starts, redirect all players to the game mode page.
  useEffect(() => {
    if (gameId && actualGameMode)
      router.push(`/${actualGameMode}/game/${gameId}`);
  }, [gameId, actualGameMode, router]);

  // If the lobby doesn't exist or the session is invalid, return to the home page.
  useEffect(() => {
    if (
      fetchLobby.error?.message === "404" ||
      fetchLobby.error?.message === "403"
    ) {
      router.push("/");
    }
  }, [fetchLobby.error, router]);

  const removeMutation = useRemovePlayer(lobbyId, (targetPlayerId) => {
    if (targetPlayerId === myPlayerId) {
      router.push("/");
    } else {
      void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    }
  });

  const startGameMutation = useStartGame(lobbyId);
  const transferOwnerMutation = useTransferOwner(lobbyId);
  const { flushAsync: flushConfigSync } = useConfigSync(
    lobbyId,
    isOwner,
    wsConnected,
  );

  function handleRefetch() {
    void fetchLobby.refetch();
  }

  async function handleStartGame(
    gameMode: Parameters<typeof startGameMutation.mutate>[0]["gameMode"],
  ) {
    await flushConfigSync();
    startGameMutation.mutate({ gameMode });
  }

  if (!validatedGameMode || storedLobbyId === undefined || hasDifferentLobby)
    return null;

  const configPanel =
    fetchLobby.data && !gameId ? (
      isOwner || fetchLobby.data.config.showConfigToPlayers ? (
        isOwner ? (
          <GameConfigurationPanel
            config={fetchLobby.data.config}
            playerCount={fetchLobby.data.players.length}
            readOnly={false}
            isPending={startGameMutation.isPending}
            onStartGame={() => {
              if (actualGameMode) {
                void handleStartGame(actualGameMode);
              }
            }}
          />
        ) : (
          <GameConfigurationPanel
            config={fetchLobby.data.config}
            playerCount={fetchLobby.data.players.length}
            readOnly={true}
          />
        )
      ) : null
    ) : null;

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{LOBBY_PAGE_COPY.title}</h1>
        <ShareLobby lobbyId={lobbyId} gameMode={validatedGameMode} />
      </div>

      {fetchLobby.isLoading && (
        <p className="text-muted-foreground">{LOBBY_PAGE_COPY.loading}</p>
      )}

      {fetchLobby.error &&
        fetchLobby.error.message !== "404" &&
        fetchLobby.error.message !== "403" && (
          <p className="text-destructive text-sm mb-3">
            {LOBBY_PAGE_COPY.errorPrefix}
            {fetchLobby.error.message}
          </p>
        )}

      {!fetchLobby.isLoading && fetchLobby.data === null && (
        <JoinPrompt
          lobbyId={lobbyId}
          onJoined={() => {
            setSessionId(getSessionId());
          }}
        />
      )}

      {removeMutation.error && (
        <p className="text-destructive text-sm mb-3">
          {LOBBY_PAGE_COPY.errorPrefix}
          {removeMutation.error.message}
        </p>
      )}

      {configPanel}

      {fetchLobby.data && (
        <PlayerList
          lobby={fetchLobby.data}
          userPlayerId={myPlayerId}
          showLeave={!isOwner}
          showRemovePlayer={isOwner}
          showMakeOwner={isOwner}
          showRefresh={!wsConnected}
          isFetching={fetchLobby.isFetching}
          disabled={startGameMutation.isPending || gameId !== undefined}
          onRefetch={handleRefetch}
          onRemovePlayer={(playerId: string) => {
            removeMutation.mutate(playerId);
          }}
          onTransferOwner={(playerId: string) => {
            void flushConfigSync().then(() => {
              transferOwnerMutation.mutate(playerId);
            });
          }}
        />
      )}
    </div>
  );
}
