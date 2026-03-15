"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createLobby,
  joinLobby,
  removePlayer,
  updateLobbyConfig,
  getLobby,
  clearSession,
} from "@/lib/api";
import { ServerResponseStatus } from "@/server/types";
import type {
  LobbyJoinResponse,
  UpdateLobbyConfigRequest,
} from "@/server/types";

export function useCreateLobby() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (playerName: string) => {
      const response = await createLobby(playerName);
      if (response.status === ServerResponseStatus.Error)
        throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      router.push(`/lobby/${data.lobby.id}`);
    },
  });
}

export function useJoinLobby(onSuccess: (data: LobbyJoinResponse) => void) {
  return useMutation({
    mutationFn: async ({
      lobbyId,
      playerName,
    }: {
      lobbyId: string;
      playerName: string;
    }) => {
      const response = await joinLobby(lobbyId, playerName);
      if (response.status === ServerResponseStatus.Error)
        throw new Error(response.error);
      return response.data;
    },
    onSuccess,
  });
}

export function useLeaveAndJoinLobby(onSuccess: () => void) {
  return useMutation({
    mutationFn: async ({
      storedLobbyId,
      myPlayerId,
      lobbyId,
      playerName,
    }: {
      storedLobbyId: string;
      myPlayerId: string;
      lobbyId: string;
      playerName: string;
    }) => {
      await removePlayer(storedLobbyId, myPlayerId);
      clearSession();
      await joinLobby(lobbyId, playerName);
    },
    onSuccess,
  });
}

export function useUpdateLobbyConfig(lobbyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: UpdateLobbyConfigRequest) =>
      updateLobbyConfig(lobbyId, config),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      queryClient.setQueryData(["lobby", lobbyId], response.data.lobby);
    },
  });
}

/**
 * Fetches the lobby the user currently belongs to. Clears the local session
 * if the lobby no longer exists or the session is invalid (404/403).
 */
export function useStoredLobbyQuery(storedLobbyId: string | undefined) {
  return useQuery({
    queryKey: ["stored-lobby", storedLobbyId],
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
}

/**
 * Fetches a lobby by ID with polling (every 3s until the game starts).
 * Throws on 404/403 so callers can redirect accordingly.
 */
export function useLobbyQuery(
  lobbyId: string,
  { enabled, disablePolling }: { enabled: boolean; disablePolling?: boolean },
) {
  return useQuery({
    queryKey: ["lobby", lobbyId],
    queryFn: async () => {
      const { data, httpStatus } = await getLobby(lobbyId);
      if (httpStatus === 404 || httpStatus === 403)
        throw new Error(String(httpStatus));
      if (data.status === ServerResponseStatus.Error) return null;
      return data.data;
    },
    refetchInterval: (query) => {
      if (disablePolling) return false;
      if (!query.state.data) return false;
      if (query.state.data.gameId) return false;
      return 3_000;
    },
    enabled,
    retry: false,
  });
}

/**
 * Checks whether a lobby exists without joining it. Returns true if the lobby
 * exists (even if the current session belongs to a different lobby), false if not.
 */
export function useLobbyExistsQuery(lobbyId: string) {
  return useQuery({
    queryKey: ["target-lobby-exists", lobbyId],
    queryFn: async () => {
      const { httpStatus } = await getLobby(lobbyId);
      // 403 means the lobby exists but the session belongs to a different one — expected.
      // 404 means the lobby doesn't exist at all.
      return httpStatus !== 404;
    },
    retry: false,
  });
}
