"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  removePlayer,
  toggleReady,
  transferOwner,
  reorderPlayers,
  renamePlayer,
  addNoDevicePlayer,
} from "@/lib/api";
import { ServerResponseStatus } from "@/server/types";

export function useRemovePlayer(
  lobbyId: string,
  onSuccess: (targetPlayerId: string) => void,
) {
  return useMutation({
    mutationFn: (targetPlayerId: string) =>
      removePlayer(lobbyId, targetPlayerId),
    onSuccess: (response, targetPlayerId) => {
      if (response.status === ServerResponseStatus.Error) return;
      onSuccess(targetPlayerId);
    },
  });
}

export function useToggleReady(lobbyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => toggleReady(lobbyId),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      queryClient.setQueryData(["lobby", lobbyId], response.data.lobby);
    },
  });
}

export function useReorderPlayers(lobbyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playerOrder: string[]) => reorderPlayers(lobbyId, playerOrder),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      queryClient.setQueryData(["lobby", lobbyId], response.data.lobby);
    },
  });
}

export function useTransferOwner(lobbyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetPlayerId: string) =>
      transferOwner(lobbyId, targetPlayerId),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    },
  });
}

export function useRenamePlayer(lobbyId: string, playerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playerName: string) => {
      if (!playerId) throw new Error("Unauthorized");
      const response = await renamePlayer(lobbyId, playerId, playerName);
      if (response.status === ServerResponseStatus.Error) {
        throw new Error(response.error);
      }
      return response.data.lobby;
    },
    onSuccess: (lobby) => {
      queryClient.setQueryData(["lobby", lobbyId], lobby);
    },
  });
}

export function useOwnerRenamePlayer(lobbyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      playerId,
      playerName,
    }: {
      playerId: string;
      playerName: string;
    }) => {
      const response = await renamePlayer(lobbyId, playerId, playerName);
      if (response.status === ServerResponseStatus.Error) {
        throw new Error(response.error);
      }
      return response.data.lobby;
    },
    onSuccess: (lobby) => {
      queryClient.setQueryData(["lobby", lobbyId], lobby);
    },
  });
}

export function useAddNoDevicePlayer(lobbyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playerName: string) => {
      const response = await addNoDevicePlayer(lobbyId, playerName);
      if (response.status === ServerResponseStatus.Error) {
        throw new Error(response.error);
      }
      return response.data.lobby;
    },
    onSuccess: (lobby) => {
      queryClient.setQueryData(["lobby", lobbyId], lobby);
    },
  });
}
